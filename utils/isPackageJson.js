/** @babel */
import { statSync } from "fs";

function isPackageJson (path) {
    try {
        const stats = statSync(path);
        return !stats.isDirectory();
    } catch ( error ) {
        return false;
    }
}

export default isPackageJson;
