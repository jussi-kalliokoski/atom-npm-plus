/** @babel */

import classNames from "classnames";

function el (tagName, props, ...children) {
    const element = document.createElement(tagName);

    if ( props ) {
        Object.keys(props).forEach(key => { element[key] = props[key]; });
    }

    children
        .filter(child => child)
        .reduce((children, child) => Array.isArray(child) ? children.concat(child) : children.concat([child]), [])
        .map(child => typeof child === "string" ? document.createTextNode(child) : child)
        .forEach(child => element.appendChild(child));

    return element;
}

function ActiveTab ({
    selectedTask,
}) {
    return selectedTask && el("pre", {
        className: "commandOutput",
    },
        selectedTask.outputElement,
    );
}

function Tab ({
    task,
    selectedTask,
    onTaskSelected,
    onTaskClosed,
}, ...children) {
    return el("tabs-tab", {
        className: classNames("tab", {
            active: task === selectedTask,
        }),
        onclick: event => {
            onTaskSelected(task);
            event.stopPropagation();
        },
    },
        el("div", { className: "title" }, children),
        el("div", {
            className: "close-icon",
            onclick: event => {
                onTaskClosed(task);
                event.stopPropagation();
            },
        }),
    );
}

function Tabs ({
    activeTasks,
    lastFailedTask,
    selectedTask,
    onTaskSelected,
    onTaskClosed,
}) {
    if ( activeTasks.length === 0 && !lastFailedTask ) { return; }
    return el("atom-tabs", {
        className: classNames("list-inline", "tab-bar", "inset-panel"),
        tabIndex: "-1",
    },
        lastFailedTask && Tab({
            task: lastFailedTask,
            selectedTask: selectedTask,
            onTaskSelected: onTaskSelected,
            onTaskClosed: onTaskClosed,
        }, "Last failed task"),
        activeTasks.map(task => Tab({
            task: task,
            selectedTask: selectedTask,
            onTaskSelected: onTaskSelected,
            onTaskClosed: onTaskClosed,
        }, task.command)),
    );
}

function render ({
    lastFailedTask,
    activeTasks,
    selectedTask,
    onTaskSelected,
    onTaskClosed,
}) {
    return el("div", null,
        Tabs({
            lastFailedTask,
            activeTasks,
            selectedTask,
            onTaskSelected,
            onTaskClosed,
        }),
        ActiveTab({
            selectedTask,
        }),
    );
}

export default render;
