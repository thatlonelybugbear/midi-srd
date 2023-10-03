export async function darkOnesBlessing(args) {
    const {[0]:{actor:sourceActor, hitTargets, damageList, workflow:{token:sourceToken}}} = args ?? {};
    if (!hitTargets?.length || !damageList || damageList[0].newHP) return;
    if (!sourceActor.classes.warlock?.system.levels) return ui.notifications.warn("MidiSRD: You have added Dark One's Blessing Item on an Actor without warlock levels.");
    const level = sourceActor.classes.warlock.system.levels;
    const damage = sourceActor.system.abilities.cha.mod + level;
    const item = sourceActor.items.getName("Dark One's Blessing");
    await item.displayCard()
    await MidiQOL.applyTokenDamage([{damage, type:"temphp"}],damage,new Set([sourceToken]), item, null, {forceApply:false})
}