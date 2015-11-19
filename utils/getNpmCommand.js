/** @babel */

const WINDOWS_DEFAULT_COMMAND = "C:\\Program Files\\nodejs\\npm.cmd";
const DEFAULT_COMMAND = "npm";
const WIN32 = "win32";

function getNpmCommand () {
    if ( process.platform === "win32" ) { return WINDOWS_DEFAULT_COMMAND; }
    return DEFAULT_COMMAND;
}

export default getNpmCommand;
