import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs';
export async function protectionFromEnergy(args) { //done - check
    if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
    const content = `
<form class="MidiSRD-protEnergy">
        <div class="form-group" id="types">
          <label class="radio-label">
            <input type="radio" name="type" value="acid">
            <img src="icons/magic/acid/dissolve-bone-white.webp" style="border:0px; width: 50px; height:50px;">
              Acid
          </label>
          <label class="radio-label">
            <input type="radio" name="type" value="cold">
            <img src="icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp" style="border:0px; width: 50px; height:50px;">
            Cold
          </label>
          <label class="radio-label">
          <input type="radio" name="type" value="fire">
          <img src="icons/magic/fire/barrier-wall-flame-ring-yellow.webp" style="border:0px; width: 50px; height:50px;">
          Fire
        </label>
        <label class="radio-label">
        <input type="radio" name="type" value="lightning">
        <img src="icons/magic/lightning/bolt-strike-blue.webp" style="border:0px; width: 50px; height:50px;">
        Lighting
      </label>
            <label class="radio-label">
            <input type="radio" name="type" value="thunder">
            <img src="icons/magic/sonic/explosion-shock-wave-teal.webp" style="border:0px; width: 50px; height:50px;">
            Thunder
          </label>
        </div>
      </form>`
    let element;
    if (args[0].tag === "OnUse") {
        const targetTokenDoc = args[0].targets[0];  //Token5e#Document
        const targetActor = targetTokenDoc.actor;
        element = await Dialog.prompt({
            title: 'Choose a damage type',
            content,
            label: "OK",
            callback: () => {
                let elem = $("input[type='radio'][name='type']:checked").val();
                return elem;
            },
            rejectClose:false,
        });
        if (!element) {
            Hooks.once("midi-qol.preApplyDynamicEffects", (workflow) => {return false});
            return;
        }
        //await DAE.setFlag(targetActor, 'ProtectionFromEnergy', element);
        const resistances = targetActor.system.traits.dr.value.toObject().concat(element);
        await warpgate.mutate(targetTokenDoc,{actor:{"system.traits.dr.value":resistances},flags:{'midi-srd':{'ProtectionFromEnergy':element}}},{},{name:`Protection from Energy: ${element}`})
        await ChatMessage.create({ content: `The target gains resistance to ${element}` });
    }
    if (args[0] === "on") { }
    if (args[0] === "off") {
        const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
        if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
        element = DAE.getFlag(actor, 'ProtectionFromEnergy');
        await warpgate.revert(token.document,`Protection from Energy: ${element}`)
       // await DAE.unsetFlag(actor, 'ProtectionFromEnergy');
        await ChatMessage.create({ content: `The target loses resistance to ${element}` });
    }
}