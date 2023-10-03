import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'

export async function alterSelf(args) {
    if (args[0] !== "on" && args[0] !== "off") {
        const { actor, workflow: {token, item}, macroPass, workflow } = args[0] ?? {};
        if (!token || !item || !actor || !macroPass || !workflow) return ui.notifications.error("MidiSRD-Alter Self: Notify GM to make sure that Item Sheet hooks are off in Item Macro module settings");
        if (macroPass === "preItemRoll" && MidiQOL.getConcentrationEffect(actor)?.origin === item.uuid) {
            workflow.config.consumeUsage = false;
            workflow.config.consumeSpellLevel = false;
            workflow.config.consumeSpellSlot = false;
            workflow.config.needsConfiguration = false;
            workflow.options.configureDialog = false;
            return true;
        }
    }
    else {
        if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
        const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
        if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
        const DAEitem = actor.items.find(i => i.name === "Unarmed Strike"); // find unarmed strike attack
        const mutName = "alterSelfMidiSRD"
        if (args[0] === "on") {
            const magicItems = actor.items.filter(i=>!!i.system?.rarity)
            //const content = `
            //<style>
             //   #MidiSRD-alterSelf .dialog-buttons {
              //      display:`
            const result = await Dialog.wait({
                title: "Choose Alter Self type",
                content: "",
                buttons: magicItems.map(i=>({label:i.name, icon: `<img src=${i.img} height="20" width="20" align="center"></img>`}))
            },{},{width:"auto",id:"MidiSRD-alterSelf"});
        }
        if (args[0] === "off") {
            if (!DAEitem) return;
            await warpgate.revert(token.document,mutName);
            await ChatMessage.create({ content: "Alter Self expired" });
        }
    }
}


/*buttons: {
                one: {
                    label: "Yes",
                    callback: async () => {
                        if (!DAEitem) {
                            await ChatMessage.create({ content: "No unarmed strike found" }); // exit out if no unarmed strike
                            return;
                        }
                        let copy_item = duplicate(DAEitem);
                        if (MidiSRDHelpers._hasMutation(token.document,mutName)) await warpgate.revert(token.document,mutName);
                        await warpgate.mutate(token.document, {embedded:{Item:{[`${copy_item.name}`]:{"system.damage.parts[0][0]":"1d6 + @mod"}}}},{},{name:mutName});
                        await ChatMessage.create({ content: "Unarmed strike is altered" });
                    }
                },
                two: {
                    label: "No",
                    callback: async () => await ChatMessage.create({ content: `Unarmed strike not altered` })
                }
            }
            */