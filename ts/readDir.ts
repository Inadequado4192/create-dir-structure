namespace ReadDir {
    // import { xml2js, Element } from "xml-js";
    // import convert from "./XMLConvert";
    // import JSZip from "jszip";
    // import FileSaver from "file-saver";

    // type Defs = { [dir: string]: { [file: string]: Element } };
    // let Defs: Defs = {};

    // function defaultElem() {
    //     let elem: HTMLElement | null;
    //     if (elem = document.querySelector("code")) return elem;
    //     elem = document.createElement("code");
    //     elem.id = "defaultElem"
    //     return document.body.appendChild(elem);
    //     // <code id="container" ></codeid>
    // }

    export function addEventListenerTo(elem: HTMLElement = document.body, param: Omit<Parameters, "dir">) {
        elem.addEventListener("dragover", (e) => {
            e.preventDefault();
        });
        elem.addEventListener("drop", async (e) => {
            e.preventDefault();
            ReadDir.read(Object.assign({
                dir: e.dataTransfer!.items[0]!.webkitGetAsEntry()!
            }, param));
        });
    }



    interface NewFileSystemEntry extends FileSystemEntry {
        createReader: () => {
            readEntries: (a: (entries: NewFileSystemEntry[]) => void) => void;
        };
        file: (a: (fileObject: File) => void) => void;
    }

    export interface Parameters {
        dir: FileSystemEntry // DataTransferItemList
        fileFn?(file: FileFn): Awaited<void>
        dirFn?(file: DirFn): Awaited<void | boolean>
        end?(): void
    }

    export interface FileFn {
        file: FileSystemEntry,
        deep: number
    }
    export interface DirFn {
        file: FileSystemEntry,
        deep: number,
        // length: number
    }

    export type DataFn = FileFn | DirFn;

    // namespace Tree {
    //     export interface Dir {
    //         file: FileSystemEntry
    //         files: DF[]
    //     }
    //     export interface File {
    //         file: FileSystemEntry
    //     }
    //     export type DF = Dir | File;
    // }

    export async function read(params: Parameters) {
        if (!params.dir.isDirectory) throw Error("File must be a directory");
        await processFD({
            file: params.dir,
            deep: 0
        });
        await params.end?.();

        async function processFD(dataFn: DataFn) {
            if (dataFn.file.isFile) {
                await params.fileFn?.({
                    deep: dataFn.deep,
                    file: dataFn.file
                });
            } else if (dataFn.file.isDirectory) {
                let res = await params.dirFn?.({
                    deep: dataFn.deep,
                    file: dataFn.file,
                });
                if (res === false) return;
                await processDirectory(dataFn);
            }
        }

        function processDirectory(dataFn: DataFn) {
            let directory = dataFn.file as NewFileSystemEntry;
            return new Promise<void>((t, f) => {
                const reader = directory.createReader();
                reader.readEntries(async e => {
                    for (const entry of e) await processFD({
                        file: entry,
                        deep: dataFn.deep + 1
                    });
                    t();
                });
            })
        }
    }

    // export async function read(params: Parameters) {
    //     let TREE: Tree.Dir = {
    //         file: params.dir,
    //         files: []
    //     }
    //     if (!TREE.file.isDirectory) throw Error("File must be a directory");
    //     await processFD(TREE);

    //     // console.log(console.log(JSON.stringify(TREE, null, 4)));

    //     async function processFD(tree: Tree.Dir) {
    //         let { file } = tree;
    //         if (file.isFile) {
    //             tree.files.push({ file });
    //         } else if (file.isDirectory) {
    //             let newTree: Tree.Dir = { file, files: [] };
    //             tree.files.push(newTree);
    //             await processDirectory(newTree);
    //         }
    //     }

    //     function processDirectory(tree: Tree.Dir) {
    //         let directory = tree.file as NewFileSystemEntry;
    //         return new Promise<void>((t, f) => {
    //             const reader = directory.createReader();
    //             reader.readEntries(async e => {
    //                 // for (const entry of e) {
    //                 //     let newTree = { file: entry };
    //                 //     tree.files.push(newTree);
    //                 //     await processFD(newTree);
    //                 // }
    //                 t();
    //             });
    //         })
    //     }



    //     await (async function Return(files: Tree.DF[]) {
    //         for (let o of files) {
    //             if (o.file.isFile) {
    //                 await params.fileFn?.({
    //                     file: o.file,
    //                     deep: 0,
    //                 });
    //             } else {
    //                 await params.dirFn?.({
    //                     file: o.file,
    //                     deep: 0,
    //                     length: 0
    //                 });
    //             }
    //         }
    //     })([TREE]);
    //     params.end?.();
    // }
}
export default ReadDir;