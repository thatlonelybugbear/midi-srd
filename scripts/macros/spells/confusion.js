import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function confusion(args) { //done
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    if (args[0] === "each") {

        let confusionRoll = await new Roll("1d10").evaluate({ async: false });
        let content;
        switch (confusionRoll.total) {
            case 1:
                content = `The creature uses all its movement to move in a random direction. To determine the direction, roll a [[/r 1d8]] and assign a direction to each die face. The creature doesn't take an action this turn.`;
                break;
            case 2:
                content = " The creature doesn't move or take actions this turn.";
                break;
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                content = "The creature uses its action to make a melee attack against a randomly determined creature within its reach. If there is no creature within its reach, the creature does nothing this turn.";
                break;
            case 8:
            case 9:
            case 10:
                content = "The creature can act and move normally.";
                break;
        }
        const flavor = await TextEditor.enrichHTML(`<b>Confusion roll for ${token.name} is ${confusionRoll.total}</b>:<br> ` + content)
        await confusionRoll.toMessage({flavor});
    }
}