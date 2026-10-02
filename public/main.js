import { registerMoorhenWebComponent } from "moorhen/web-component";

// Define the <moorhen-web-component> custom element (idempotent).
registerMoorhenWebComponent();

const status = document.getElementById("status-text");
const buttons = {
    load: document.getElementById("load-7avk"),
    centre: document.getElementById("center-residue-1231"),
    sphere: document.getElementById("add-sphere"),
    recolour: document.getElementById("recolour-sphere"),
    vector: document.getElementById("add-vector"),
    clearObjects: document.getElementById("clear-objects")
};

/**
 * Everything this page draws is tagged with this, so the clear button can take exactly what the
 * page made and nothing else. It is the reason to prefer clearing by tag over clearing all:
 * another part of Moorhen, or another script on the page, may have drawn things of its own.
 */
const PAGE_TAG = { source: "webcomponent-test-page" };

/** Put a message on the page as well as in the console, so the page says what it is doing. */
const say = (message) => {
    status.textContent = message;
    console.log(message);
};

/**
 * Run a handler with its button disabled, and report a failure on the page.
 *
 * Without this, a rejected promise inside a click handler goes to the console as an unhandled
 * rejection and the page sits there looking as though nothing happened.
 */
const onClick = (button, message, handler) =>
    button?.addEventListener("click", async () => {
        const wasDisabled = button.disabled;
        button.disabled = true;
        say(message);
        try {
            await handler();
        } catch (error) {
            say(`${message} - failed: ${error?.message ?? error}`);
            console.error(error);
        } finally {
            button.disabled = wasDisabled;
        }
    });

// Everything is disabled until Moorhen is up: getMoorhenInstance() only resolves once the wasm
// has downloaded and the scene is built, and the API is not there to be called before that.
for (const button of Object.values(buttons)) {
    if (button) button.disabled = true;
}

const moorhen = document.getElementById("moorhen-1");

say("Starting Moorhen (downloading wasm, building the scene)...");
const moorhenInstance = await moorhen.getMoorhenInstance();

// The object and curated vector APIs are newer than the last published package, so this
// feature-detects rather than assuming: against a plain npm moorhen the shape buttons simply
// stay disabled instead of the page throwing.
const hasObjectApi = typeof moorhenInstance.object?.create === "function";
const hasVectorApi = typeof moorhenInstance.vectors?.create === "function";

buttons.load.disabled = false;
// Neither needs a molecule - a shape is independent of what is loaded.
if (hasObjectApi) buttons.sphere.disabled = false;
if (hasVectorApi) buttons.vector.disabled = false;
say(
    hasObjectApi || hasVectorApi
        ? `Moorhen ready. ${hasObjectApi ? `${moorhenInstance.object.types.length} shapes` : "no object API"}, ` +
          `${hasVectorApi ? "vectors curated" : "vectors raw only"}. No structure loaded yet.`
        : "Moorhen ready. This build has neither instance.object nor instance.vectors.create, " +
          "so the shape buttons are disabled. No structure loaded yet."
);

/** The molecule loaded by the button below, so the later actions know what to act on. */
let molecule = null;
/** The sphere created by the shape button, kept so recolour and delete have a handle. */
let sphereUid = null;

onClick(buttons.load, "Loading 7AVK from PDBe...", async () => {
    // The same URL Moorhen uses internally for a PDBe entry.
    const results = await moorhenInstance.files.loadFiles(
        "https://www.ebi.ac.uk/pdbe/entry-files/download/7avk.cif"
    );
    const loaded = results.find(result => result.type === "molecule");
    if (!loaded) {
        say("7AVK downloaded, but nothing in it was read as a molecule.");
        return;
    }
    molecule = moorhenInstance.getMolecule(loaded.uniqueID);
    const chains = molecule.sequences.map(seq => seq.chain).join(", ");
    say(`Loaded ${loaded.fileName} as molecule ${loaded.molNo}. Chains: ${chains || "none reported"}.`);
    buttons.centre.disabled = false;
});

onClick(buttons.centre, "Centring on residue 1231...", async () => {
    // centerOnResidue needs a chain as well as a number, and which chain holds 1231 is a
    // property of this entry rather than something to hard-code. Ask the molecule.
    const chain = molecule?.sequences.find(seq =>
        seq.sequence.some(residue => residue.resNum === 1231)
    )?.chain;

    if (!chain) {
        const ranges = (molecule?.sequences ?? []).map(seq => {
            const nums = seq.sequence.map(r => r.resNum);
            return `${seq.chain} ${Math.min(...nums)}-${Math.max(...nums)}`;
        });
        say(`No chain contains residue 1231. Present: ${ranges.join(", ") || "nothing"}.`);
        return;
    }

    moorhenInstance.centerOnResidue(chain, 1231, molecule.uniqueId);
    say(`Centred on /1/${chain}/1231.`);
});

/**
 * Where the camera is currently looking, in scene coordinates.
 *
 * `sceneSettings.origin` holds the NEGATED view centre, which is why it is flipped here:
 * centerOnCoordinate(x, y, z) is implemented as setOrigin([-x, -y, -z]), in this build and in
 * the published one. Reading it goes through the store, which MoorhenInstance exposes because
 * it extends StoreExtension.
 */
const viewCentre = () => {
    const [x, y, z] = moorhenInstance.store.getState().sceneSettings.origin;
    return [-x, -y, -z];
};

onClick(buttons.sphere, "Adding a sphere where you are looking...", async () => {
    const where = viewCentre();
    sphereUid = moorhenInstance.object.create({
        type: "sphere",
        origin: where,
        radius: 5,
        colour: "#ff8800ff",
        tags: PAGE_TAG
    });
    say(
        `Sphere created at the view centre (${where.map(v => v.toFixed(1)).join(", ")}), ` +
        `uniqueId ${sphereUid}. ${moorhenInstance.object.list().length} object(s) in the scene.`
    );
    buttons.recolour.disabled = false;
    buttons.clearObjects.disabled = false;
});

onClick(buttons.recolour, "Recolouring the sphere...", async () => {
    // A partial edit: the radius and origin set above are kept.
    const changed = moorhenInstance.object.edit(sphereUid, {
        colour: "#3366ffff",
        wireframe: true
    });
    const sphere = moorhenInstance.object.get(sphereUid);
    say(
        changed
            ? `Edited ${sphereUid}: now ${sphere.colour}, wireframe ${sphere.wireframe}, radius still ${sphere.radius}.`
            : `No object with id ${sphereUid}.`
    );
});

onClick(buttons.vector, "Adding a vector at the view centre...", async () => {
    // Vectors are drawn between two points (or two atoms - that is what coordsMode selects).
    // From the view centre, 15 A up, so it is on screen next to the sphere.
    const [x, y, z] = viewCentre();
    const uid = moorhenInstance.vectors.create({
        coordsMode: "points",
        xFrom: x, yFrom: y, zFrom: z,
        xTo: x, yTo: y + 15, zTo: z,
        arrowMode: "end",
        labelMode: "middle",
        labelText: "15 A",
        vectorColour: { r: 50, g: 200, b: 120 },
        tags: PAGE_TAG
    });
    say(
        `Vector created, uniqueId ${uid}. ${moorhenInstance.vectors.list().length} vector(s) ` +
        `in the scene, ${moorhenInstance.vectors.list(PAGE_TAG).length} of them this page's.`
    );
    buttons.clearObjects.disabled = false;
});

onClick(buttons.clearObjects, "Removing what this page drew...", async () => {
    // By tag, not clear(), so anything Moorhen itself drew is left alone. Passing no argument
    // would take everything; passing {} would take nothing.
    const objects = moorhenInstance.object.clear(PAGE_TAG);
    const vectors = moorhenInstance.vectors.clear(PAGE_TAG);
    sphereUid = null;
    buttons.recolour.disabled = true;
    buttons.clearObjects.disabled = true;
    say(`Removed ${objects} object(s) and ${vectors} vector(s), all tagged ${JSON.stringify(PAGE_TAG)}.`);
});

// Handy at the console: `window.moorhenInstance.object.create({ type: "torus" })`.
window.moorhenInstance = moorhenInstance;
