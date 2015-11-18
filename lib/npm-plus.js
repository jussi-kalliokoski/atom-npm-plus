/** @babel */
import { CompositeDisposable } from "atom";
import { spawn } from "child_process";
import getPackageDir from "../utils/getPackageDir";
import TaskInspectorView from "./TaskInspectorView";

const STDERR = "STDERR";
const STDOUT = "STDOUT";
const ACTIVATED = "ACTIVATED";
const TASK_COMPLETED = "TASK_COMPLETED";
const TASK_FAILED = "TASK_FAILED";
const TASK_STARTED = "TASK_STARTED";
const TASK_SELECTED = "TASK_SELECTED";
const TASK_CLOSED = "TASK_CLOSED";
const DATA_RECEIVED = "DATA_RECEIVED";

let state;
let views;
let subscriptions;

function render (state) {
    views.container.replaceChild(TaskInspectorView({
        ...state,
        onTaskSelected: task => { dispatch({ type: TASK_SELECTED, task: task }) },
        onTaskClosed: task => { dispatch({ type: TASK_CLOSED, task: task }) },
    }), views.container.firstChild);
}

function dropTask (state, task) {
    return {
        ...state,
        activeTasks: state.activeTasks
            .filter(currentTask => currentTask !== task),
    };
}

function middleware (state, action) {
    switch ( action.type ) {
        case TASK_COMPLETED:
            action.task.child = null;
            atom.notifications.addSuccess(`npm ${action.task.command} completed successfully`);
            break;
        case TASK_FAILED:
            action.task.child = null;
            if ( action.detail === "SIGTERM" ) { break; }
            atom.notifications.addError(`npm ${action.task.command} failed`, {
                detail: action.detail || "Process returned non-zero.",
            });
            views.panel.show();
            break;
        case TASK_CLOSED:
            if ( !action.task.child ) { break; }

            action.task.child.kill();
            action.task.child = null;
            break;
        case DATA_RECEIVED:
            action.task.outputElement.appendChild(document.createTextNode(action.data));
            break;
    }

    return action;
}

function reducer (state = {
    activeTasks: [],
    lastFailedTask: null,
    selectedTask: null,
}, action) {
    switch ( action.type ) {
        case TASK_COMPLETED:
            return {
                ...dropTask(state, action.task),
                selectedTask: state.selectedTask === action.task ?
                    null :
                    state.selectedTask,
            };
        case TASK_FAILED:
            if ( action.detail === "SIGTERM" ) {
                return dropTask(state, action.task);
            }

            return {
                ...dropTask(state, action.task),
                lastFailedTask: action.task,
                selectedTask: state.selectedTask === state.lastFailedTask ?
                    action.task :
                    state.selectedTask,
            };
        case TASK_STARTED:
            return {
                ...state,
                activeTasks: [...state.activeTasks, action.task],
                selectedTask: state.selectedTask || action.task,
            };
        case TASK_SELECTED:
            return {
                ...state,
                selectedTask: action.task,
            };
        case TASK_CLOSED:
            return {
                ...dropTask(state, action.task),
                lastFailedTask: state.lastFailedTask === action.task ?
                    null :
                    state.lastFailedTask,
                selectedTask: state.selectedTask === action.task ?
                    null :
                    state.selectedTask,
            };
    }

    return state;
}

function dispatch (action) {
    state = reducer(state, middleware(state, action));
    render(state);
}

function npm (command) {
    const path = getPackageDir();
    const child = spawn("npm", [command], {
        cwd: path
    });
    const outputElement = document.createElement("div");
    const task = { command, path, child, outputElement };

    child.stdout.on("data", buffer => { dispatch({ type: DATA_RECEIVED, channel: STDOUT, task: task, data: buffer.toString() }); });
    child.stderr.on("data", buffer => { dispatch({ type: DATA_RECEIVED, channel: STDERR, task: task, data: buffer.toString() }); });

    dispatch({ type: TASK_STARTED, task: task })

    child.on("error", error => {
        dispatch({ type: TASK_FAILED, task: task, detail: error.message });
    });

    child.on("exit", (code, reason) => {
        dispatch({ type: code === 0 ? TASK_COMPLETED : TASK_FAILED, task: task, detail: reason });
    });
}

function runRestart () {
    npm("restart");
}

function runStop () {
    npm("stop");
}

function runStart () {
    npm("start");
}

function runTests () {
    npm("test");
}

function runBuild () {
    npm("install");
}

function toggleView (view) {
    if ( view.isVisible() ) {
        view.hide();
    } else {
        view.show();
    }
}

function toggle () {
    toggleView(views.panel);
}

function registerCommands () {
    const subscriptions = new CompositeDisposable();
    subscriptions.add(atom.commands.add("atom-workspace", "npm-plus:install", runBuild));
    subscriptions.add(atom.commands.add("atom-workspace", "npm-plus:test", runTests));
    subscriptions.add(atom.commands.add("atom-workspace", "npm-plus:start", runStart));
    subscriptions.add(atom.commands.add("atom-workspace", "npm-plus:stop", runStop));
    subscriptions.add(atom.commands.add("atom-workspace", "npm-plus:restart", runRestart));
    subscriptions.add(atom.commands.add("atom-workspace", "npm-plus:toggle", toggle));
    return subscriptions;
}

function initializeTasks () {
    const activeTasks = [];
    return activeTasks;
}

function createViews () {
    const container = document.createElement("div");
    container.className = "npm-plus";
    container.appendChild(document.createElement("div"));

    const panel = atom.workspace.addBottomPanel({
        item: container,
        visible: false,
    });

    return { container, panel };
}

function activate () {
    subscriptions = registerCommands();
    state = reducer(undefined, { type: ACTIVATED });
    views = createViews();
}

function deactivate () {
    subscriptions.dispose();
    subscriptions = null;

    state.activeTasks.forEach(task => task.child.kill());
    state = null;

    views.panel.destroy();
    views = null;
}

const NpmPlus = {
    activate,
    deactivate,
};

module.exports = NpmPlus;
