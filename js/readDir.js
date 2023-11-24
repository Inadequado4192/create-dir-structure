var ReadDir;
(function (ReadDir) {
    function addEventListenerTo(elem = document.body, param) {
        elem.addEventListener("dragover", (e) => {
            e.preventDefault();
        });
        elem.addEventListener("drop", async (e) => {
            e.preventDefault();
            ReadDir.read(Object.assign({
                dir: e.dataTransfer.items[0].webkitGetAsEntry()
            }, param));
        });
    }
    ReadDir.addEventListenerTo = addEventListenerTo;
    async function read(params) {
        if (!params.dir.isDirectory)
            throw Error("File must be a directory");
        await processFD({
            file: params.dir,
            deep: 0
        });
        await params.end?.();
        async function processFD(dataFn) {
            if (dataFn.file.isFile) {
                await params.fileFn?.({
                    deep: dataFn.deep,
                    file: dataFn.file
                });
            }
            else if (dataFn.file.isDirectory) {
                let res = await params.dirFn?.({
                    deep: dataFn.deep,
                    file: dataFn.file,
                });
                if (res === false)
                    return;
                await processDirectory(dataFn);
            }
        }
        function processDirectory(dataFn) {
            let directory = dataFn.file;
            return new Promise((t, f) => {
                const reader = directory.createReader();
                reader.readEntries(async (e) => {
                    for (const entry of e)
                        await processFD({
                            file: entry,
                            deep: dataFn.deep + 1
                        });
                    t();
                });
            });
        }
    }
    ReadDir.read = read;
})(ReadDir || (ReadDir = {}));
export default ReadDir;
