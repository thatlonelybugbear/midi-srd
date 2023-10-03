import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function blindDeafness(args) { //check
    if (!game.modules.get("dfreds-convenient-effects")?.active) return ui.notifications.error("Please enable the DFreds CE module");
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");

    if (args[0] === "on") {
        new Dialog({
            title: "Choose an Effect",
            buttons: {
                one: {
                    label: "Blindness",
                    callback: async () => {
                        await DAE.setFlag(actor, "DAEBlind", "blind")
                        if (!MidiSRDHelpers._hasDfred("Blinded",actor)) await MidiSRDHelpers._removeDfred("Blinded", actor)
                        await MidiSRDHelpers._addDfred("Blinded", actor)
                    }
                },
                two: {
                    label: "Deafness",
                    callback: async () => {
                        await DAE.setFlag(actor, "DAEBlind", "deaf")
                        if (!MidiSRDHelpers._hasDfred("Deafened",actor)) await MidiSRDHelpers._removeDfred("Deafened", actor)
                        await MidiSRDHelpers._addDfred("Deafened", actor)
                    }
                }
            },
        }).render(true);
    }
    if (args[0] === "off") {
        const flag = DAE.getFlag(actor, "DAEBlind")
        if (flag === "blind") {
            await MidiSRDHelpers._removeDfred("Blinded", actor)
        } else if (flag === "deaf") {
            await MidiSRDHelpers._removeDfred("Deafened", actor)
        }
        await DAE.unsetFlag(actor, "DAEBlind")
    }
}