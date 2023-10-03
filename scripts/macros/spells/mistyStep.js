import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function mistyStep(args) {   //done - check
    const { token } = MidiSRDHelpers._targets(args) ?? {};
    if( !token ) return ui.notifications.error("MidiSRD - mistyStep: no token defined; Notify GM");
    await MidiSRDHelpers._moveToken(token,30,"Misty Step")
}