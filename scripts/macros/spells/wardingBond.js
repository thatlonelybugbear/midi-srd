import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function wardingBond(args) {
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    console.log(args);
    if(!actor || !token || !lArgs) return ui.notifications.error("MidiSRD - wardingBons: Something is wrong in the macro of the Item rolled; Notify GM");
    const newHp = getProperty(lArgs.updates, "system.attributes.hp.value");
    const oldHp = lArgs.targetActor.system.attributes.hp.value;
    const { originItem } = lArgs;
    if (newHp && newHp < oldHp) {
        const msg = await originItem.displayCard({createMessage:false});
        const FOOTER = document.createElement("FOOTER");
        FOOTER.innerHTML = msg.content;
        FOOTER.querySelector("FOOTER.card-footer").remove();
        const damage = oldHp - newHp;
        await ChatMessage.create({content: FOOTER.innerHTML + `${lArgs.originItem.name} does ${damage} damage to ${lArgs.sourceActor.name}`});
      // This requires the damage card to be displayed to work. Preferably enable auto apply damage.
      //MidiQOL.applyTokenDamage([{damage, type: "none"}], damage, new Set([lArgs.sourceToken]), fromUuidSync(lArgs.origin), new Set(), { existingDamage: [], superSavers: new Set(), semiSuperSavers: new Set(), workflow: null, updateContext: {onUpdateCalled: true} });
        const damageRoll = await new Roll(`${damage}`).evaluate({async:true});
        new MidiQOL.DamageOnlyWorkflow(actor,token,damageRoll.total,'none',[lArgs.sourceToken],damageRoll,{itemData:null,itemCardId:'none'})
  }
}