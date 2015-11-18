/** @babel */
import { join } from "path";
import isPackageJson from "./isPackageJson";

const PACKAGE_JSON_FILENAME = "package.json";

function getPackageDir () {
    const projectPaths = atom.project.getPaths();

    for ( path of projectPaths ) {
        const filename = join(path, PACKAGE_JSON_FILENAME);
        if ( !isPackageJson(filename) ) { continue; }
        return path;
    }

    return null;
}

export default getPackageDir;
