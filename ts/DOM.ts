import ReadDir from "./readDir.js";

const containerElem = document.getElementById("container") as HTMLElement;
const settingsElem = document.getElementById("settings") as HTMLElement;


export default function initDOM() {
    let text = "", spaceN = 2;

    let space = (n: number, s: string = " ") => "".padEnd(n, s);

    containerElem.addEventListener("dragover", (e) => {
        e.preventDefault();
    });
    containerElem.addEventListener("drop", async (e) => {
        e.preventDefault();
        text = "";
        // const settings = Object.fromEntries(Settings.map(s => [s, getSetting(s)] as const)) as unknown as Settings;

        const settings = Object.fromEntries(Object.entries(Settings).map(([n]) => [n, getSetting(n as any)])) as Settings;

        function valid(file: FileSystemEntry) {
            if (
                (settings["exlude-node_modules"] && file.name == "node_modules") ||
                (settings["exlude-hidden-files"] && file.name.startsWith(".")) ||
                (settings["exlude-by-regexp"] !== "" && file.name.search(eval(settings["exlude-by-regexp"])) > -1 ) ||
                (settings["include-by-regexp"] !== "" && file.name.search(eval(settings["include-by-regexp"])) == -1 )
            ) return false;
            return true;
        }

        const basedir = e.dataTransfer!.items[0]!.webkitGetAsEntry()!;
        ReadDir.read({
            dir: basedir,
            dirFn({ file, deep }) {
                if (file !== basedir && !valid(file)) return false;
                text += `${space(deep * spaceN)}<span red>+</span> ${file.name}\n`;
            },
            fileFn({ file, deep }) {
                if (!valid(file)) return false;
                text += `${space(deep * spaceN)}<span red>-</span> ${file.name}\n`;
            },
            end() {
                containerElem.innerHTML = text;
            }
        });
    });
}


// const Settings = ["exlude-node_modules", "exlude-hidden-files"] as const;
// type Settings = typeof Settings[number];

type InputType = "checkbox" | "text"
type GetType<T extends InputType> = T extends "checkbox" ? boolean : T extends "text" ? string : unknown;
type Settings = { [K in keyof typeof Settings]: GetType<typeof Settings[K]["type"]> }

const Settings = {
    "exlude-node_modules": {
        type: "checkbox",
        attr: "checked"
    },
    "exlude-hidden-files": {
        type: "checkbox",
        attr: "checked"
    },
    "exlude-by-regexp": {
        type: "text",
        attr: "style=\"font-family: monospace;\""
    },
    "include-by-regexp": {
        type: "text",
        attr: "value=\"/./g\" style=\"font-family: monospace;\""
    }
} satisfies Record<string, {
    type: InputType
    // onlyFor?: "D" | "F"
    attr?: string
}>

(function initSettings(s) {
    for (let name in s) {
        let o = s[name as keyof typeof s];
        settingsElem.innerHTML += `
            <label data-setting="${name}">
                <input type="${o.type}" ${"attr" in o ? o.attr : ""}>
                <span>${name.replaceAll("-", " ")}</span>
            </label>
        `;
    }
})(Settings);

function getSetting(name: keyof typeof Settings): unknown {
    let elem = document.querySelector(`#settings label[data-setting=${name}]`);
    if (!elem) throw Error(`"${name}" not found`);
    let input = elem.querySelector("input")
    if (!input) throw Error(`Not input in: ${name}`);

    switch (input.type) {
        case "checkbox": return input.checked;
        case "text": return input.value;
    }
}