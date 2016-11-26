/** @babel */
import { join } from "path";
import isPackageJson from "./isPackageJson";

const PACKAGE_JSON_FILENAME = "package.json";

function getPackageDir () {
    // Check active file's project root first
    var editor = atom.workspace.getActivePaneItem();
    if (editor) {
        var file = editor.buffer.file;
        if (file) {
            var filepath = file.path;
            pathinfo = atom.project.relativizePath(filepath);
            jsonpath = join(pathinfo[0], PACKAGE_JSON_FILENAME);
            if (isPackageJson(jsonpath)) {
                return pathinfo[0];
            }
        }
    }

    const projectPaths = atom.project.getPaths();

    for ( path of projectPaths ) {
        const filename = join(path, PACKAGE_JSON_FILENAME);
        if ( !isPackageJson(filename) ) { continue; }
        return path;
    }

    return null;
}

export default getPackageDir;
