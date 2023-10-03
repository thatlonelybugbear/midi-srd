export async function glovesMissileSnaring(args) {
    console.log(args)
    if (args[0].macroPass == "isAttacked") {
        const { options:{token:targetToken,actor:targetActor}, workflow:{item} } = args[0] ?? {};
        if (!targetToken || !targetActor || !item) return ui.notifications.error("MidiSRD Gloves of Missile Snaring macro error, please notify the GM");
        if (item.system.actionType == "rwak") {
            const deflectItem = targetToken.actor.items.find(i=>i.getFlag("midi-srd","sourceId") == "tmrJlIOK0XLKCM1y");
            let activation = duplicate(deflectItem.system.activation)
            activation.type = "reactiondamage";
            await deflectItem.update({"system.activation":activation});
            return console.log(args," | ","THIS")
        }
    }
    console.log("HERE")
    if (!args[0]) return;
    console.log(args)
    const {actor:deflectActor,workflow:{token:deflectToken,item:deflectItem},itemCardId,workflowOptions:{sourceActorUuid,sourceItemUuid,sourceAmmoUuid,damageTotal}} = args[0] ?? {};
    if (!deflectActor || !deflectToken || !itemCardId || !sourceActorUuid || !sourceItemUuid || !damageTotal) return ui.notifications.error("MidiSRD Gloves of Missile Snaring macro error - Notify GM");

    const sourceItem = fromUuidSync(sourceItemUuid);
    const sourceActor = fromUuidSync(sourceActorUuid).actor;

    //const deflectItem = deflectActor.items.find(i=>i.getFlag("midi-srd","sourceId") == "tmrJlIOK0XLKCM1y")
    const deflectMsg = game.messages.get(itemCardId)//await deflectItem.displayCard({createMessage:false})
    const DIV = document.createElement("DIV");
    DIV.innerHTML = deflectMsg.content;
    DIV.querySelector("div.card-buttons").remove();
    const deflectRoll = await new Roll("1d10 + @abilities.dex.mod",deflectActor.getRollData()).evaluate({async:true});
    
    const msg = await deflectRoll.toMessage({flavor:DIV.innerHTML},{create:false})
    //await game.dice3d?.showForRoll(deflectRoll,game.user,true);
    const newMessage = duplicate(msg)
    newMessage._id = deflectMsg._id
    const deflectRollMsg = await ChatMessage.updateDocuments([newMessage])

    const effectData = {
        changes: [
            {key: 'flags.midi-qol.DR.all', value: deflectRoll.total, mode: 5, priority: 20}
        ],
        label: "Missile Snaring",
        flags: {dae:{specialDuration: ['1Reaction']}},
        origin: deflectItem.uuid
    }
    await deflectActor.createEmbeddedDocuments("ActiveEffect", [effectData])
    if (damageTotal <= deflectRoll.total) {
        if (!!deflectActor.items.getName(sourceItem.name)) await deflectActor.items.getName(sourceItem.name).update({"system.quantity": deflectActor.items.getName(sourceItem.name).system.quantity + 1})
        else {
            const copyItem = duplicate(sourceItem)
            copyItem.system.quantity = 1;
            await deflectActor.createEmbeddedDocuments("Item", [copyItem])
        }
    }
    let activation = duplicate(deflectItem.system.activation)
    activation.type = "reactionmanual";
    await deflectItem.update({"system.activation":activation});
}