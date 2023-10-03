import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function fireStorm(args) {
    const { workflow:{item}, templateUuid, macroPass, actor } = args[0];
    if (macroPass === "preItemRoll") {
        if (actor.sheet._state === 2) game.actorSheetState = true;
    }
    if (macroPass === "templatePlaced") {
        const templateinitial = fromUuidSync(args[0].templateUuid);
        const templateData = templateinitial.toObject();
        let targets = MidiQOL.selectTargetsForTemplate(templateinitial.object)
        const getTargetsIds = await nameMe();
        game.user.updateTokenTargets(getTargetsIds);
        if (game.actorSheetState) {
            actor.sheet.maximize();
            game.actorSheetState = false;
        }

        async function nameMe() {
            if (game.actorSheetState) actor.sheet.minimize();
            for (let i=1; i<10; i++) {
                const result = await Dialog.confirm({
                    title: "Fire Storm templates placement",
                    content: `Do you want to place template number ${i+1} out of 10`,
                    rejectClose:false
                });
                if (!result) break;
                const config = {label:"Fire Storm templates",icon:item.img,lockSize:true,size:2,rememberControlled:true,interval:1};
                const {x,y,cancelled} = await warpgate.crosshairs.show(config);
                if (cancelled) break;
                templateData.x = x - canvas.grid.size;
                templateData.y = y - canvas.grid.size;
                if (!templateData) break;
                const [template] = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [templateData])
                targets = targets.concat(MidiQOL.selectTargetsForTemplate(template.object));
            }
            return targets.map(i=>i.id);
        }
    }
}
