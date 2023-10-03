/**
 * @param {Object} args MidiQOL workflow arguments
 * @returns {Object} actor, token, lArgs
 */
export function _targets(args) {
    const lastArg = args.at(-1);
    let tactor, ttoken;
    if (lastArg.tokenId) {
        ttoken = canvas.tokens.get(lastArg.tokenId);
        tactor = ttoken.actor
    }
    else tactor = game.actors.get(lastArg.actorId);
    return { actor: tactor, token: ttoken, lArgs: lastArg }
}

/**
 * @param {Object} args MidiQOL onUse workflow arguments
 * @returns {Object} actor, token, workflow
 */
export function _onUseArgs(args) {
    let tactor, ttoken;
    if (args[0].tokenId) {
        ttoken = canvas.tokens.get(lastArg.tokenId);
        tactor = ttoken.actor;
    }
    return { actor: tactor, token: ttoken, workflow: args[0].workflow}
}

/**
 * @param {Object} templateData 
 * @param {Actor5e} actor 
 */
export function _createTemplate(templateData, actor) {
    let doc = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene })
    let template = new game.dnd5e.canvas.AbilityTemplate(doc)
    template.actorSheet = actor.sheet;
    template.drawPreview()
}

/**
 * @param {Object} data 
 */
export async function _createActor(data) {
    await MidiQOL.socket().executeAsGM("createActor",{actorData:data});
}

/**
 * @param {String} flagName 
 * @param {Actor5e} actor 
 */
export async function _deleteTemplates(flagName, actor) {
    let removeTemplates = canvas.templates.placeables.filter(i => i.document.flags["midi-srd"]?.[flagName]?.ActorId === actor.id);
    let templateArray = removeTemplates.map(function (w) { return w.id })
    if (removeTemplates) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", templateArray)
};

/**
 * @param {String} flagName 
 * @param {Actor5e} actor 
 */
export async function _deleteTokens(flagName, actor) {
    let removeTokens = canvas.tokens.placeables.filter(i => i.document.flags["midi-srd"]?.[flagName]?.ActorId === actor.id);
    let tokenArray = removeTokens.map(function (w) { return w.id })
    if (removeTokens) await canvas.scene.deleteEmbeddedDocuments("Token", tokenArray)
};

/**
 * @param {String} flagName 
 * @param {Actor5e} actor 
 */
export async function _deleteItems(flagName, actor) {
    let items = actor.items.filter(i => i.flags["midi-srd"]?.[flagName]?.ActorId === actor.id)
    let itemArray = items.map(function (w) { return w._id })
    if (itemArray.length > 0) await actor.deleteEmbeddedDocuments("Item", itemArray);
};

/**
 * @param {String} effectName 
 * @param {Actor5e} actor 
 */
export async function _addDfred(effectName, actor) {
    await game.dfreds.effectInterface.addEffect({ effectName, uuid: actor.uuid })
};

/**
 * @param {String} effectName 
 * @param {Actor5e} actor 
 */
export async function _removeDfred(effectName, actor) {
    await game.dfreds.effectInterface.removeEffect({ effectName, uuid: actor.uuid })
};

/**
 * @param {String} effectName 
 * @param {Actor5e} actor
 * @returns boolean
 */
export function _hasDfred(effectName,actor) {
    return game.dfreds.effectInterface.hasEffectApplied(effectName,actor.uuid);
}

/**
 * @param {Token} token Token to move
 * @param {Number} maxRange Range in ft
 * @param {String} name Name of the Effect
 * @param {Boolean} animate Animate move, default false
 * @param {Boolean} checkCollision Check to see if the token can see the end point, default false
 */
export async function _moveToken(token, maxRange, name, animate = false, checkColision = false){
    let snap = token.document.width/2 === 0 ? 1 : -1
    let {x, y} = await this.warpgateCrosshairs(token, maxRange, name, token.document.texture.src, token.document, snap);
    let pos = canvas.grid.getSnappedPosition(x-5, y-5, 1);
    await token.document.update(pos, {animate});
}

/**
 * @param {Token} source Source of range distance (usually)
 * @param {Number} maxRange range of crosshairs
 * @param {String} name Name to use
 * @param {String} icon Crosshairs Icon
 * @param {Object} tokenData {height; width} 
 * @param {Number} snap snap position, 2: half grid intersections, 1: on grid intersections, 0: no snap, -1: grid centers, -2: half grid centers
 * @returns 
 */
export async function _warpgateCrosshairs(source, maxRange, name, icon, tokenData, snap) {
    const sourceCenter = source.center;
    let cachedDistance = 0;
    const checkDistance = async (crosshairs) => {

        while (crosshairs.inFlight) {
            //wait for initial render
            await warpgate.wait(100);
            const ray = new Ray(sourceCenter, crosshairs);
            const distance = canvas.grid.measureDistances([{ ray }], { gridSpaces: true })[0];

            //only update if the distance has changed
            if (cachedDistance !== distance) {
                cachedDistance = distance;
                if (distance > maxRange) crosshairs.icon = 'icons/svg/hazard.svg';
                else crosshairs.icon = icon;
                crosshairs.draw();
                crosshairs.label = `${distance}/${maxRange} ft`;
            }
        }
    }
    const callbacks = { show: checkDistance };
    let location = await warpgate.crosshairs.show({ size: tokenData.width, icon: source.document.texture.src, label: '0 ft.', interval: snap }, callbacks);
    if (location.cancelled) return false;
    while (cachedDistance > maxRange) {
        ui.notifications.error(`${name} has a maximum range of ${maxRange} ft.`);
        location = await warpgate.crosshairs.show({ size: tokenData.width, icon: source.document.texture.src, label: '0 ft.', interval: snap }, callbacks);
        if (location.cancelled) return false;
    }
    return location;
}

/**
 * @param {Token5e || Token5e#Document} token
 * @param {String} mutName the name of the mutation
 * @returns true or false;
 */
export function _hasMutation(token,mutName) {
    const tokenDoc = token instanceof TokenDocument ? token : token.document;
    const stack = warpgate.mutationStack(tokenDoc);
    return !!stack.getName(mutName);
}

/**
 * @param {Number} ms
 */
export async function _wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}