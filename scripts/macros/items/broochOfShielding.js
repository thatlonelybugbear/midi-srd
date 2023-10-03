export async function broochOfShielding(args) {
    const {options:{actor},itemCardId} = args[0] ?? {};
    if (!actor || !itemCardId) return ui.notifications.error("MidiSRD - Brooch of Shielding: Something is wrong with the ItemMacro, please inform the GM");
    const msg = game.messages.get(itemCardId);
    const item = fromUuidSync(msg.flags['midi-qol'].itemUuid);
    if (item.name === "Magic Missile") {
        const broochItem = actor.items.find(i=>i.getFlag('midi-srd','sourceId') === "PjFv3lRewVTQKT1A");
        await broochItem?.displayCard()
        const effectData = {
            changes: [{key: 'system.traits.di.value', value: 'force', mode: 0, priority: 20}],
            flags: {dae:{specialDuration:['isHit']}},
            label: "Brooch of Shielding negating Magic Missiles",
            origin: broochItem.uuid
        }
        await actor.createEmbeddedDocuments("ActiveEffect",[effectData]);
        Hooks.once(`midi-qol.RollComplete.${item.uuid}`, async (workflow) => {
            await actor.deleteEmbeddedDocuments("ActiveEffect",[actor.effects.find(eff=>eff.label==="Brooch of Shielding negating Magic Missiles").id]);
        });
    };
};