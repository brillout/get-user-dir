For libraries to get the directory of the user's code.

More precisely, `getUserDir` returns the first directory in the call stack trace that is not in `node_modules/`.

### Usage Example

~~~js
const getUserDir = require('@brillout/get-user-dir');

const userDir = getUserDir();
~~~

You can as well manually set the "user directory":

~~~js
const getUserDir = require('@brillout/get-user-dir');

const userDir = '/path/to/user/code'
getUserDir.userDir = userDir;

assert(getUserDir() === userDir);
~~~

This is typically used in the context of a CLI.
The CLI entry module then does `getUserDir.userDir = process.cwd();`.
(The user-code directory can't be retrieved with a call stack coming from a CLI call. Instead, `process.cwd()` can act as user-code directory.)
