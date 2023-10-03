import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function enlargeReduce(args) { //done
    const muName = "enlarge/reduce"
    if (args[0].tag === "OnUse") {
        console.log(args);
        const { actor, workflow:{token,applicationTargets,item}, saves } = args[0] ?? {};
        if(!applicationTargets.size) return;
        if(!actor || !token ) return ui.notifications.error("MidiSRD - Enlarge/reduce: Something is wrong in the macro of the Item rolled; Notify GM");
        const targets = applicationTargets.map(t=>t.document); //TokenDocument5e
        for (const target of targets) {
             if (MidiSRDHelpers._hasMutation(target,muName)) await warpgate.revert(target,`${muName}:${target.name}`);
            const originalWidth = target.width;
            const originalHeight = target.height;
            const mwak = target.actor.system.bonuses.mwak.damage;
            new Dialog({
                title: "Enlarge or Reduce",
                buttons: {
                    one: {
                        label: "Enlarge",
                        callback: async () => {
                            const bonus = mwak.concat("+1d4");
                            const enlargedWidth = (originalWidth + 1);
                            const enlargedHeight = (originalHeight + 1)
                            const updates = {
                                actor: {"system.bonuses.mwak.damage":bonus},
                                token: {"width": enlargedWidth, "height": enlargedHeight}
                            }
                            await warpgate.mutate(target, updates, {}, {name:`${muName}:${target.name}`, origin:item.uuid, description:item.name});
                            //await ChatMessage.create({ content: `${target.name} is enlarged` });
                        }
                    },
                    two: {
                        label: "Reduce",
                        callback: async () => {
                            const bonus = mwak.concat("-1d4");
                            const reducedWidth = (originalWidth > 1) ? (originalWidth - 1) : (originalWidth - 0.3);
                            const reducedHeight = (originalHeight > 1) ? (originalHeight - 1) : (originalHeight - 0.3);
                            const updates = {
                                actor: {"system.bonuses.mwak.damage":bonus},
                                token: {"width": reducedWidth, "height": reducedHeight}
                            }
                            await warpgate.mutate(target, updates, {}, {name:`${muName}:${target.name}`});
                            //await ChatMessage.create({ content: `${token.name} is reduced` });
                        }
                    },
                }
            }).render(true);            
        }
    }
    if (args[0] === "off") {
        const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
        if(!actor || !token || !lArgs) return ui.notifications.error("MidiSRD - Enlarge/reduce: Something is wrong in the macro of the Item rolled; Notify GM");
        await warpgate.revert(token.document,`${muName}:${token.document.name}`);
        //await ChatMessage.create({ content: `${token.name} is returned to normal size` });
    }
}