class MidiMacros {

    static targets(args) {
        const lastArg = args[args.length - 1];
        let tactor, ttoken;
        if (lastArg.tokenId) {
            ttoken = canvas.tokens.get(lastArg.tokenId);
            tactor = ttoken.actor
        }
        else tactor = game.actors.get(lastArg.actorId);
        return { actor: tactor, token: ttoken, lArgs: lastArg }
    }
    /**
     * 
     * @param {Object} templateData 
     * @param {Actor5e} actor 
     */
    static templateCreation(templateData, actor) {
        let doc = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene })
        let template = new game.dnd5e.canvas.AbilityTemplate(doc)
        template.actorSheet = actor.sheet;
        template.drawPreview()
    }

    /**
     * 
     * @param {String} flagName 
     * @param {Actor5e} actor 
     */
    static async deleteTemplates(flagName, actor) {
        let removeTemplates = canvas.templates.placeables.filter(i => i.document.flags["midi-srd"]?.[flagName]?.ActorId === actor.id);
        let templateArray = removeTemplates.map(function (w) { return w.id })
        if (removeTemplates) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", templateArray)
    };

    static async deleteTokens(flagName, actor) {
        let removeTokens = canvas.tokens.placeables.filter(i => i.document.flags["midi-srd"]?.[flagName]?.ActorId === actor.id);
        let tokenArray = removeTokens.map(function (w) { return w.id })
        if (removeTokens) await canvas.scene.deleteEmbeddedDocuments("Token", tokenArray)
    };

    /**
     * 
     * @param {String} flagName 
     * @param {Actor5e} actor 
     */
    static async deleteItems(flagName, actor) {
        let items = actor.items.filter(i => i.flags["midi-srd"]?.[flagName]?.ActorId === actor.id)
        let itemArray = items.map(function (w) { return w._id })
        if (itemArray.length > 0) await actor.deleteEmbeddedDocuments("Item", itemArray);
    }

    /**
     * 
     * @param {String} name 
     * @param {Actor5e} actor 
     */
    static async addDfred(name, actor) {
        await game.dfreds.effectInterface.addEffect({ effectName: name, uuid: actor.uuid })
    }

    /**
     * 
     * @param {String} name 
     * @param {Actor5e} actor 
     */
    static async removeDfred(name, actor) {
        await game.dfreds.effectInterface.removeEffect({ effectName: name, uuid: actor.uuid })
    }

    /**
     * 
     * @param {Token} token Token to move
     * @param {Number} maxRange Range in ft
     * @param {String} name Name of the Effect
     * @param {Boolean} animate Animate move, default false
     */
    static async moveToken(token, maxRange, name, animate = false){
        let snap = token.document.width/2 === 0 ? 1 : -1
        let {x, y} = await this.warpgateCrosshairs(token, maxRange, name, token.document.texture.src, token.document, snap)
        let pos = canvas.grid.getSnappedPosition(x-5, y-5, 1)
        await token.document.update(pos, {animate : animate})
    }

    /**
     * 
     * @param {Token} source Source of range distance (usually)
     * @param {Number} maxRange range of crosshairs
     * @param {String} name Name to use
     * @param {String} icon Crosshairs Icon
     * @param {Object} tokenData {height; width} 
     * @param {Number} snap snap position, 2: half grid intersections, 1: on grid intersections, 0: no snap, -1: grid centers, -2: half grid centers
     * @returns 
     */
    static async warpgateCrosshairs(source, maxRange, name, icon, tokenData, snap) {
        const sourceCenter = source.center;
        let cachedDistance = 0;
        const checkDistance = async (crosshairs) => {

            while (crosshairs.inFlight) {
                //wait for initial render
                await warpgate.wait(100);
                const ray = new Ray(sourceCenter, crosshairs);
                const distance = canvas.grid.measureDistances([{ ray }], { gridSpaces: true })[0]

                //only update if the distance has changed
                if (cachedDistance !== distance) {
                    cachedDistance = distance;
                    if (distance > maxRange) {
                        crosshairs.icon = 'icons/svg/hazard.svg'
                    } else {
                        crosshairs.icon = icon
                    }
                    crosshairs.draw()
                    crosshairs.label = `${distance}/${maxRange} ft`
                }
            }

        }
        const callbacks = {
            show: checkDistance
        }
        const location = await warpgate.crosshairs.show({ size: tokenData.width, icon: source.document.texture.src, label: '0 ft.', interval: snap }, callbacks)
        console.log(location)

        if (location.cancelled) return false;
        if (cachedDistance > maxRange) {
            ui.notifications.error(`${name} has a maximum range of ${maxRange} ft.`)
            return false;
        }
        return location
    }

    static hasMutation(token,mutName) {
        const tokenDoc = token.document ?? token;
        const stack = warpgate.mutationStack(tokenDoc);
        return !!stack.getName(mutName)
    }

    static async aid(args) {
        const { actor, token, lArgs } = MidiMacros.targets(args)
        let buf = (parseInt(args[1]) - 1) * 5;
        let curHP = actor.getRollData().attributes.hp.value;
        let curMax = actor.getRollData().attributes.hp.max;

        if (args[0] === "on") {
            await actor.update({ "system.attributes.hp.value": curHP + buf })
        } else if (curHP > (curMax)) {
            await actor.update({ "system.attributes.hp.value": curMax })

        }
    }

    static async alterSelf(args) {
        //DAE Item Macro 
        const { actor, token, lArgs } = MidiMacros.targets(args)
        let DAEitem = actor.items.find(i => i.name === `Unarmed Strike`); // find unarmed strike attack
        if (args[0] === "on") {
            new Dialog({
                title: "Are you using Natural Weapons",
                content: "",
                buttons: {
                    one: {
                        label: "Yes",
                        callback: async () => {
                            if (!DAEitem) {
                                await ChatMessage.create({ content: "No unarmed strike found" }); // exit out if no unarmed strike
                                return;
                            }
                            let copy_item = duplicate(DAEitem);
                            await DAE.setFlag(actor, 'AlterSelfSpell', copy_item.system.damage.parts[0][0]); //set flag of previous value
                            copy_item.system.damage.parts[0][0] = "1d6 +@mod"; //replace with new value
                            await await actor.updateEmbeddedDocuments("Item", [copy_item]); //update item
                            await ChatMessage.create({ content: "Unarmed strike is altered" });
                        }
                    },
                    two: {
                        label: "No",
                        callback: async () => await ChatMessage.create({ content: `Unarmed strike not altered` })
                    },
                }
            }).render(true);
        }
        if (args[0] === "off") {
            let damage = DAE.getFlag(actor, 'AlterSelfSpell'); // find flag with previous values
            if (!DAEitem) return;
            let copy_item = duplicate(DAEitem);
            copy_item.system.damage.parts[0][0] = damage; //replace with old value
            await await actor.updateEmbeddedDocuments("Item", [copy_item]); //update item
            await DAE.unsetFlag(actor, 'world', 'AlterSelfSpell',); //remove flag
            await ChatMessage.create({ content: `Alter Self expired, unarmed strike returned` });
        }
    }

    static async animateDead(args) {
        if (!game.modules.get("warpgate")?.active) ui.notifications.error("Please enable the Warp Gate module")
        const { actor, token, lArgs } = MidiMacros.targets(args)
        if (!game.actors.getName("MidiSRD")) { await Actor.create({ name: "MidiSRD", type: "npc" }) }
        let cycles = 1 + (lArgs.spellLevel - 3) * 2
        const buttonData = {
            buttons: [{
                label: 'Zombie',
                value: {
                    token: { name: "Zombie" },
                    actor: { name: "Zombie" },
                }
            }, {
                label: 'Skeleton',
                value: {
                    actor: { name: "Skeleton" },
                    token: { name: "Skeleton" },
                }
            }
            ], title: 'Which type of Undead?'
        };
        let pack = game.packs.get('dnd5e.monsters')
        await pack.getIndex()
        for (let i = 0; i < cycles; i++) {
            let dialog = await warpgate.buttonDialog(buttonData);
            let index = pack.index.find(i => i.name === dialog.actor.name)
            let compendium = await pack.getDocument(index._id)
            let updates = {
                token: compendium.protorypeToken,
                actor: compendium.toObject()
            }
            await warpgate.spawn("MidiSRD", updates, {}, { controllingActor: actor });
        }
    }

    static async arcaneEye(args, texture) {
        if (!game.modules.get("warpgate")?.active) ui.notifications.error("Please enable the Warp Gate module")
        const { actor, token, lArgs } = MidiMacros.targets(args)
        if (args[0] === "on") {
            if (!game.actors.getName("MidiSRD")) { await Actor.create({ name: "MidiSRD", type: "npc" }) }
            const sourceItem = await fromUuid(lArgs.origin)
            texture = texture || sourceItem.img
            let updates = {
                token: { "name": "Arcane Eye", "img": texture, "dimVision": 30, scale: 0.4, "flags": { "midi-srd": { "ArcaneEye": { "ActorId": actor.id } } } },
                actor: { "name": "Arcane Eye" }
            }
            let { x, y } = await MidiMacros.warpgateCrosshairs(token, 30, "Arcane Eye", texture, {}, -1)

            await warpgate.spawnAt({ x, y }, "MidiSRD", updates, { controllingActor: actor },);
        }
        if (args[0] === "off") {
            await MidiMacros.deleteTokens("ArcaneEye", actor)
        }
    }

    static async arcaneHand(args, texture) {
        const { actor, token, lArgs } = MidiMacros.targets(args)
        if (args[0] === "on") {
            if (!game.modules.get("warpgate")?.active) ui.notifications.error("Please enable the Warp Gate module")
            if (!game.actors.getName("MidiSRD")) { await Actor.create({ name: "MidiSRD", type: "npc" }) }
            const sourceItem = await fromUuid(lArgs.origin)
            texture = texture || sourceItem.img
            const summonerDc = actor.system.attributes.spelldc;
            const summonerAttack = summonerDc - 8;
            const summonerMod = getProperty(actor, `system.abilities.${getProperty(actor, 'system.attributes.spellcasting')}.mod`)
            let fistScale = '';
            let graspScale = '';
            if ((lArgs.powerLevel - 5) > 0) {
                fistScale = ` + ${((lArgs.powerLevel - 5) * 2)}d8[upcast]`;
            }
            if ((lArgs.powerLevel - 5) > 0) {
                graspScale = ` + ${((lArgs.powerLevel - 5) * 2)}d6[upcast]`;
            }
            let updates = {
                token: { "name": "Arcane Hand", "img": texture, height: 2, width: 2, "flags": { "midi-srd": { "ArcaneHand": { "ActorId": actor.id } } } },
                actor: {
                    "name": "Arcane Hand",
                    "system.attributes.hp": { value: actor.system.attributes.hp.max, max: actor.system.attributes.hp.max },
                },
                embedded: {
                    Item: {
                        "Clenched Fist": {
                            'system.attackBonus': `- @mod - @prof + ${summonerAttack}`,
                            'system.damage.parts': [[`4d8 ${fistScale}`, 'force']],
                            "type": "weapon"
                        },
                        "Grasping Hand": {
                            'system.damage.parts': [[`2d6 ${graspScale} + ${summonerMod}`, 'bludgeoning']],
                            "type": "weapon"
                        }
                    }
                }
            }
            let { x, y } = await MidiMacros.warpgateCrosshairs(token, 120, "Arcane Hand", texture, { height: 2, width: 2 }, 1)

            await warpgate.spawnAt({ x, y }, "MidiSRD", updates, { controllingActor: actor });
        }
        if (args[0] === "off") {
            await MidiMacros.deleteTokens("ArcaneHand", actor)
        }
    }

    static async arcaneSword(args, texture) {
        //DAE Macro Execute, Effect Value = "Macro Name" @target
        const { actor, token, lArgs } = MidiMacros.targets(args)

        let casterToken = canvas.tokens.get(lArgs.tokenId) || token;
        const DAEitem = lArgs.efData.flags.dae.itemData
        const saveData = DAEitem.system.save
        /**
         * Create Arcane Sword item in inventory
         */
        if (args[0] === "on") {
            let image = DAEitem.img;
            let range = canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [{
                t: "circle",
                user: game.user.id,
                x: casterToken.x + canvas.grid.size / 2,
                y: casterToken.y + canvas.grid.size / 2,
                direction: 0,
                distance: 60,
                borderColor: "#FF0000",
                flags: { "midi-srd": { ArcaneSwordRange: { ActorId: actor.id } } }
                //fillColor: "#FF3366",
            }]);
            range.then(result => {
                let templateData = {
                    t: "rect",
                    user: game.user.id,
                    distance: 7,
                    direction: 45,
                    texture: texture || "",
                    x: 0,
                    y: 0,
                    flags: { "midi-srd": { ArcaneSword: { ActorId: actor.id } } },
                    fillColor: game.user.color
                }
                Hooks.once("createMeasuredTemplate", () => {MidiMacros.deleteTemplates("ArcaneSwordRange", actor)});
                MidiMacros.templateCreation(templateData, actor)
            })
            await actor.createEmbeddedDocuments("Item",
                [{
                    "name": "Summoned Arcane Sword",
                    "type": "weapon",
                    "system": {
                        "equipped": true,
                        "quantity": 1,
                        "activation": {
                            "type": "action",
                            "cost": 1,
                            "condition": ""
                        },
                        "target": {
                            "value": 1,
                            "type": "creature"
                        },
                        "range": {
                            "value": 5,
                            "long": null,
                            "units": ""
                        },
                        "ability": DAEitem.system.ability,
                        "actionType": "msak",
                        "attackBonus": "0",
                        "chatFlavor": "",
                        "critical": null,
                        "damage": {
                            "parts": [
                                [
                                    `3d10`,
                                    "force"
                                ]
                            ],
                            "versatile": ""
                        },
                        "weaponType": "simpleM",
                        "proficient": true,
                    },
                    "flags": {
                        "midi-srd": {
                            "ArcaneSword": {
                                "ActorId": actor.id
                            }
                        }
                    },
                    "img": image,
                }]
            );
            ui.notifications.notify("Arcane Sword created in your inventory")
        }

        // Delete Arcane Sword
        if (args[0] === "off") {
            await MidiMacros.deleteItems("ArcaneSword", actor)
            await MidiMacros.deleteTemplates("ArcaneSword", actor)
        }
    }

    static async banishment(args) {
        if (!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")
        //DAE Macro, Effect Value = @target
        const { actor, token, lArgs } = MidiMacros.targets(args)

        if (args[0] === "on") {
            await token.document.update({ hidden: true }); // hide targeted token
            await ChatMessage.create({ content: token.name + "  was banished" });
        }
        if (args[0] === "off") {
            await token.document.update({ hidden: false }); // unhide token
            await ChatMessage.create({ content: target.name + "  returned" });
        }
    }

    static async blindness(args) {
        if (!game.modules.get("dfreds-convenient-effects")?.active) { ui.notifications.error("Please enable the CE module"); return; }
        const { actor, token, lArgs } = MidiMacros.targets(args)

        if (args[0] === "on") {
            new Dialog({
                title: "Choose an Effect",
                buttons: {
                    one: {
                        label: "Blindness",
                        callback: async () => {
                            await DAE.setFlag(actor, "DAEBlind", "blind")
                            await MidiMacros.addDfred("Blinded", actor)
                        }
                    },
                    two: {
                        label: "Deafness",
                        callback: async () => {
                            await DAE.setFlag(actor, "DAEBlind", "deaf")
                            await MidiMacros.addDfred("Deafened", actor)
                        }
                    }
                },
            }).render(true);
        }
        if (args[0] === "off") {
            let flag = DAE.getFlag(actor, "DAEBlind")
            if (flag === "blind") {
                await MidiMacros.removeDfred("Blinded", actor)
            } else if (flag === "deaf") {
                await MidiMacros.removeDfred("Deafened", actor)
            }
            await DAE.unsetFlag(actor, "DAEBlind")
        }
    }

    static async callLightning(args, texture) {
        //DAE Macro no arguments passed
        if (!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")
        const { actor, token, lArgs } = MidiMacros.targets(args)
        const DAEitem = lArgs.efData.flags.dae.itemData
        const saveData = DAEitem.system.save
        /**
         * Create Call Lightning Bolt item in inventory
         */
        if (args[0] === "on") {
            let templateData = {
                t: "circle",
                user: game.user.id,
                distance: 60,
                direction: 0,
                x: 0,
                y: 0,
                texture: texture || "",
                flags: { "midi-srd": { CallLighting: { ActorId: actor.id } } },
                fillColor: game.user.color
            }
            MidiMacros.templateCreation(templateData, actor)

            await actor.createEmbeddedDocuments("Item",
                [{
                    "name": "Call Lightning - bolt",
                    "type": "spell",
                    "system": {
                        "description": {
                            "value": "<p><span style=\"color: #191813; font-size: 13px;\">A bolt of lightning flashes down from the cloud to that point. Each creature within 5 feet of that point must make a Dexterity saving throw. A creature takes 3d10 lightning damage on a failed save, or half as much damage on a successful one.</span></p>"
                        },
                        "activation": {
                            "type": "action"
                        },
                        "target": {
                            "value": 5,
                            "width": null,
                            "units": "ft",
                            "type": "radius"
                        },
                        "ability": "",
                        "actionType": "save",
                        "damage": {
                            "parts": [
                                [
                                    `${DAEitem.system.level}d10`,
                                    "lightning"
                                ]
                            ],
                            "versatile": ""
                        },
                        "formula": "",
                        "save": {
                            "ability": "dex",
                            "dc": 16,
                            "scaling": "spell"
                        },
                        "level": 0,
                        "school": "abj",
                        "preparation": {
                            "mode": "atwill",
                            "prepared": true
                        },
                        "scaling": {
                            "mode": "none",
                            "formula": ""
                        },
                    },
                    "flags": { "midi-srd": { "CallLighting": { "ActorId": actor.id } } },
                    "img": "systems/dnd5e/icons/spells/lighting-sky-2.jpg",
                    "effects": []
                }]
            );
        }

        // Delete Flame Blade
        if (args[0] === "off") {
            await MidiMacros.deleteItems("CallLighting", actor)
            await MidiMacros.deleteTemplates("CallLighting", actor)
        }
    }

    static async confusion(args) {
        const { actor, token, lArgs } = MidiMacros.targets(args)
        if (args[0] === "each") {

            let confusionRoll = await new Roll("1d10").evaluate({ async: false }).total;
            let content;
            switch (confusionRoll) {
                case 1:
                    content = "The creature uses all its movement to move in a random direction. To determine the direction, roll a  [[d8]] and assign a direction to each die face. The creature doesn't take an action this turn.";
                    break;
                case 2:
                    content = "	The creature doesn't move or take actions this turn.";
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
            await ChatMessage.create({ content: `Confusion roll for ${actor.name} is ${confusionRoll}:<br> ` + content });
        }
    }

    static async contagion(args) {
        const { actor, token, lArgs } = MidiMacros.targets(args)
        const DAEItem = lArgs.efData.flags.dae.itemData
        const dc = args[1]


        if (args[0] === "on") {

            // Save the hook data for later access.
            await DAE.setFlag(actor, "ContagionSpell", {
                count: 0,
            });
        }

        if (args[0] === "off") {
            // When off, clean up hooks and flags.

            await DAE.unsetFlag(actor, "ContagionSpell",);
        }

        if (args[0] === "each") {
            let contagion = lArgs.efData;
            if (contagion.label === "Contagion")
                Contagion()
        }

        /** 
         * Execute contagion effects, update flag counts or remove effect
         * 
         * @param {Actor5e} combatant Current combatant to test against
         * @param {Number} save Target DC for save
         */
        async function Contagion() {
            let flag = DAE.getFlag(actor, "ContagionSpell",);
            const flavor = `${CONFIG.DND5E.abilities["con"]} DC${dc} ${DAEItem?.name || ""}`;
            let saveRoll = (await actor.rollAbilitySave("con", { flavor })).total;

            if (saveRoll < dc) {
                if (flag.count === 2) {
                    await ChatMessage.create({ content: `Contagion on ${actor.name} is complete` });
                    ContagionMessage();
                    return;
                }
                else {
                    let contagionCount = (flag.count + 1);
                    await DAE.setFlag(actor, "ContagionSpell", {
                        count: contagionCount
                    });
                    console.log(`Contagion increased to ${contagionCount}`);
                }
            }
            else if (saveRoll >= dc) {
                await actor.deleteEmbeddedDocuments("ActiveEffect", [lArgs.effectId]);
            }
        }

        /**
         * Generates the GM client dialog for selecting final Effect, updates target effect with name, icon and new DAE effects.
         */
        async function ContagionMessage() {
            new Dialog({
                title: "Contagion options",
                content: "<p>Select the effect</p>",
                buttons: {
                    one: {
                        label: "Blinding Sickness",
                        callback: async () => {
                            let data = {
                                changes: [
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.check.wis",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.save.wis",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                ],
                                icon: "modules/dfreds-convenient-effects/images/blinded.svg",
                                label: "Blinding Sickness",
                                _id: lArgs.effectId
                            }
                            await actor.updateEmbeddedDocuments("ActiveEffect", [data]);
                        },
                    },
                    two: {
                        label: "Filth Fever",
                        callback: async () => {
                            let data = {
                                changes: [
                                    {
                                        key: "flags.midi-qol.disadvantage.attack.mwak",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.attack.rwak",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.check.str",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.save.str",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                ],
                                label: "Filth Fever",
                                _id: lArgs.effectId,
                            }
                            await actor.updateEmbeddedDocuments("ActiveEffect", [data]);
                        }
                    },
                    three: {
                        label: "Flesh Rot",
                        callback: async () => {
                            let data = {
                                changes: [
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.check.cha",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "system.traits.dv.all",
                                        mode: 0,
                                        priority: 20,
                                        value: "1",
                                    },
                                ],
                                icon: "systems/dnd5e/icons/skills/blood_09.jpg",
                                label: "Flesh Rot",
                                _id: lArgs.effectId,
                            }
                            await actor.updateEmbeddedDocuments("ActiveEffect", [data]);
                        },
                    },
                    four: {
                        label: "Mindfire",
                        callback: async () => {
                            let data = {
                                changes: [
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.check.int",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.save.int",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                ],
                                icon: "icons/svg/daze.svg",
                                label: "Mindfire",
                                _id: lArgs.effectId,
                            }
                            await actor.updateEmbeddedDocuments("ActiveEffect", [data]);
                        }
                    },
                    five: {
                        label: "Seizure",
                        callback: async () => {
                            let data = {
                                changes: [
                                    {
                                        key: "flags.midi-qol.disadvantage.attack.mwak",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.attack.rwak",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.check.dex",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.save.dex",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                ],
                                icon: "icons/svg/paralysis.svg",
                                label: "Seizure",
                                _id: lArgs.effectId,
                            }
                            await actor.updateEmbeddedDocuments("ActiveEffect", [data]);
                        }
                    },
                    six: {
                        label: "Slimy Doom",
                        callback: async () => {
                            let data = {
                                changes: [
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.check.con",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.save.con",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                ],
                                icon: "systems/dnd5e/icons/skills/blood_05.jpg",
                                label: "Slimy Doom",
                                _id: lArgs.effecId,
                            }
                            await actor.updateEmbeddedDocuments("ActiveEffect", [data]);
                        }
                    },
                }
            }).render(true);
        }

    }

    static async createUndead(args) {
        if (!game.modules.get("warpgate")?.active) ui.notifications.error("Please enable the Warp Gate module")
        const { actor, token, lArgs } = MidiMacros.targets(args)
        if (!game.actors.getName("MidiSRD")) { await Actor.create({ name: "MidiSRD", type: "npc" }) }
        let spelllevel = lArgs.powerLevel
        const buttonData = {
            buttons: [{
                label: 'Ghouls',
                value: {
                    token: { name: "Ghoul" },
                    actor: { name: "Ghoul" },
                    cycles: spelllevel - 3
                }
            },
            ], title: 'Which type of Undead?'
        };
        if (spelllevel > 7) buttonData.buttons.push({
            label: 'Wights',
            value: {
                actor: { name: "Wight" },
                token: { name: "Wight" },
                cycles: spelllevel - 6
            }
        }, {
            label: 'Ghasts',
            value: {
                actor: { name: "Ghast" },
                token: { name: "Ghast" },
                cycles: spelllevel - 6
            }
        })
        if (spelllevel > 8) buttonData.buttons.push({
            label: 'Mummies',
            value: {
                actor: { name: "Mummy" },
                token: { name: "Mummy" },
                cycles: 2
            }
        })
        let pack = game.packs.get('dnd5e.monsters')
        await pack.getIndex()
        let dialog = await warpgate.buttonDialog(buttonData);
        let index = pack.index.find(i => i.name === dialog.actor.name)
        let compendium = await pack.getDocument(index._id)

        let updates = {
            token: compendium.prototypeToken,
            actor: compendium.toObject()
        }
        await warpgate.spawn("MidiSRD", updates, {}, { controllingActor: actor, duplicates: dialog.cycles });
    }

    static async darkness(args) {
        if (!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")
        const { actor, token, lArgs } = MidiMacros.targets(args)
        if (args[0] === "on") {
            let templateData = {
                t: "circle",
                user: game.user.id,
                distance: 15,
                direction: 0,
                x: 0,
                y: 0,
                fillColor: game.user.color,
                flags: { "midi-srd": { Darkness: { ActorId: actor.id } } }
            };

            Hooks.once("createMeasuredTemplate", async (template) => {
                let radius = canvas.grid.size * (template.distance / canvas.grid.grid.options.dimensions.distance)
                circleWall(template.x, template.y, radius)

                await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id]);
            });
            MidiMacros.templateCreation(templateData, actor)

            async function circleWall(cx, cy, radius) {
                let data = [];
                const step = 30;
                for (let i = step; i <= 360; i += step) {
                    let theta0 = Math.toRadians(i - step);
                    let theta1 = Math.toRadians(i);

                    let lastX = Math.floor(radius * Math.cos(theta0) + cx);
                    let lastY = Math.floor(radius * Math.sin(theta0) + cy);
                    let newX = Math.floor(radius * Math.cos(theta1) + cx);
                    let newY = Math.floor(radius * Math.sin(theta1) + cy);

                    data.push({
                        c: [lastX, lastY, newX, newY],
                        move: CONST.WALL_MOVEMENT_TYPES.NONE,
                        sense: CONST.WALL_SENSE_TYPES.NORMAL,
                        dir: CONST.WALL_DIRECTIONS.BOTH,
                        door: CONST.WALL_DOOR_TYPES.NONE,
                        ds: CONST.WALL_DOOR_STATES.CLOSED,
                        flags: { "midi-srd": { Darkness: { ActorId: actor.id } } }
                    });
                }
                await canvas.scene.createEmbeddedDocuments("Wall", data)
            }
        }

        if (args[0] === "off") {
            async function removeWalls() {
                let darkWalls = canvas.walls.placeables.filter(w => w.document.flags["midi-srd"]?.Darkness?.ActorId === actor.id)
                let wallArray = darkWalls.map(function (w) {
                    return w.document._id
                })
                await canvas.scene.deleteEmbeddedDocuments("Wall", wallArray)
            }
            removeWalls()
        }
    }

    static async divineWord(args) {
        const { actor, token, lArgs } = MidiMacros.targets(args)

        async function DivineWordApply(actor, targetHp) {
            if (targetHp <= 20) {
                await actor.update({ "system.attributes.hp.value": 0 });
            } else {
                if (targetHp <= 30) {
                    if (!hasStunned) await MidiMacros.addDfred("Stunned", actor);
                    game.Gametime.doIn({ hours: 1 }, async () => {
                        await MidiMacros.removeDfred("Stunned", actor);
                    });
                }
                if (targetHp <= 40) {
                    if (!hasBlinded) await MidiMacros.addDfred("Blinded", actor);
                    game.Gametime.doIn({ hours: 1 }, async () => {
                        await MidiMacros.removeDfred("Blinded", actor);
                    });
                }
                if (targetHp <= 50) {
                    if (!hasDeafened) await MidiMacros.addDfred("Deafened", actor);
                    game.Gametime.doIn({ hours: 1 }, async () => {
                        await MidiMacros.removeDfred("Deafened", actor);
                    });
                }
            }
        }
        if (args[0] === "on") {
            DivineWordApply(actor, token.actor.system.attributes.hp.value)
        }
    }

    static async enhanceAbility(args) {
        const caster = args[0].actor;
        const targetActors = args[0].targets.map(target => target.actor);
        const item = args[0].item;

        await Dialog.prompt({
            title: "Enhance Ability",
            content: `
                <style>
                    #selectionPrompt {
                        margin-bottom: 1em;
                    }
                    #selectionPrompt label {
                        flex: 0 0 120px;
                    }
                    #selectionPrompt select {
                      margin-top: 10px;
                      margin-bottom: 10px;
                    }
                    #selectionPromptDescriptions {
                        flex-direction: column;
                    }
                </style>

                <form id="selectionPrompt" onsubmit="event.preventDefault()">
                    <div class="form-group">
                        <label for="enhanceAbilityEffect">Chosen effect:</label>
                        <div class='form-fields'>
                            <select name="enhanceAbilityEffect">
                                <option value="Bear's Endurance">Bear's Endurance</option>
                                <option value="Bull's Strength">Bull's Strength</option>
                                <option value="Cat's Grace">Cat's Grace</option>
                                <option value="Eagle's Splendor">Eagle's Splendor</option>
                                <option value="Fox's Cunning">Fox's Cunning</option>
                                <option value="Owl's Wisdom">Owl's Wisdom
                            </select>
                        </div>
                    </div>
                    <div class="selectionPromptDescriptions">
                        <p><b>Bear's Endurance.</b> The target has advantage on Constitution checks. It also gains 2d6 temporary hit points, which are lost when the spell ends.</p>
                        <p><b>Bull's Strength.</b> The target has advantage on Strength checks, and his or her carrying capacity doubles.</p>
                        <p><b>Cat's Grace.</b> The target has advantage on Dexterity checks. It also doesn't take damage from falling 20 feet or less if it isn't incapacitated.</p>
                        <p><b>Eagle's Splendor.</b> The target has advantage on Charisma checks.</p>
                        <p><b>Fox's Cunning.</b> The target has advantage on Intelligence checks.</p>
                        <p><b>Owl's Wisdom.</b> The target has advantage on Wisdom checks.</p>
                    </div>
                </form>`,
            label: "Select effect",
            callback: async (html) => {
                const selection = html.find('[name="enhanceAbilityEffect"]').val();
                const enhanceAbilityEffect = {
                    disabled: false,
                    duration: {
                        startTime: game.time.worldTime,
                        seconds: 3600,
                    },
                    origin: item.uuid,
                    icon: item.img,
                    label: `Enhance Ability (${selection})`,
                };
                if (selection === "Bear's Endurance") {
                    const tempHPRoll = await new Roll("2d6").evaluate({ async: false });
                    tempHPRoll.toMessage({
                        flavor: "Bear's Endurance: temporary hit points",
                        speaker: {
                            alias: caster.name,
                        },
                    });
                    targetActors.forEach(async (actor) => {
                        if (actor.system.attributes.hp.temp < tempHPRoll.total) {
                            await actor.update({ "system.attributes.hp.temp": tempHPRoll.total });
                        }
                    });
                    enhanceAbilityEffect.changes = [{
                        key: "flags.midi-qol.advantage.ability.check.con",
                        mode: 0,
                        priority: 20,
                        value: "1",
                    }];
                } else if (selection === "Bull's Strength") {
                    enhanceAbilityEffect.changes = [{
                        key: "flags.midi-qol.advantage.ability.check.str",
                        mode: 0,
                        priority: 20,
                        value: "1",
                    },
                    {
                        key: "system.attributes.encumbrance.max",
                        mode: 1,
                        priority: 20,
                        value: "2",
                    }];
                } else if (selection === "Cat's Grace") {
                    enhanceAbilityEffect.changes = [{
                        key: "flags.midi-qol.advantage.ability.check.dex",
                        mode: 0,
                        priority: 20,
                        value: "1",
                    }];
                } else if (selection === "Eagle's Splendor") {
                    enhanceAbilityEffect.changes = [{
                        key: "flags.midi-qol.advantage.ability.check.cha",
                        mode: 0,
                        priority: 20,
                        value: "1",
                    }];
                } else if (selection === "Fox's Cunning") {
                    enhanceAbilityEffect.changes = [{
                        key: "flags.midi-qol.advantage.ability.check.int",
                        mode: 0,
                        priority: 20,
                        value: "1",
                    }];
                } else if (selection === "Owl's Wisdom") {
                    enhanceAbilityEffect.changes = [{
                        key: "flags.midi-qol.advantage.ability.check.wis",
                        mode: 0,
                        priority: 20,
                        value: "1",
                    }];
                } else {
                    ui.notifications.warning("Unknown <i>enhance ability</i> selection; no effects applied.");
                    return;
                }

                targetActors.forEach(async (actor) => {
                    await actor.createEmbeddedDocuments("ActiveEffect", [enhanceAbilityEffect]);
                    await DAE.setFlag(actor, "enhanceAbility", {
                        name: selection,
                    });
                });
            },
        });
    }

    static async enlargeReduce(args) {
        const { actor, token, lArgs } = MidiMacros.targets(args)
        let originalSize = token.document.width;
        let mwak = actor.system.bonuses.mwak.damage;

        if (args[0] === "on") {
            new Dialog({
                title: "Enlarge or Reduce",
                buttons: {
                    one: {
                        label: "Enlarge",
                        callback: async () => {
                            let bonus = mwak + "+ 1d4";
                            let enlarge = (originalSize + 1);
                            await actor.update({ "system.bonuses.mwak.damage": bonus });
                            await token.document.update({ "width": enlarge, "height": enlarge });
                            await DAE.setFlag(actor, 'enlageReduceSpell', {
                                size: originalSize,
                                ogMwak: mwak,
                            });
                            await ChatMessage.create({ content: `${token.name} is enlarged` });
                        }
                    },
                    two: {
                        label: "Reduce",
                        callback: async () => {
                            let bonus = mwak + " -1d4";
                            let size = originalSize;
                            let newSize = (size > 1) ? (size - 1) : (size - 0.3);
                            await actor.update({ "system.bonuses.mwak.damage": bonus });
                            await token.document.update({ "width": newSize, "height": newSize });
                            await DAE.setFlag(actor, 'enlageReduceSpell', {
                                size: originalSize,
                                ogMwak: mwak,
                            });
                            await ChatMessage.create({ content: `${token.name} is reduced` });
                        }
                    },
                }
            }).render(true);
        }
        if (args[0] === "off") {
            let flag = DAE.getFlag(actor, 'enlageReduceSpell');
            await actor.update({ "system.bonuses.mwak.damage": flag.ogMwak });
            await token.document.update({ "width": flag.size, "height": flag.size });
            await DAE.unsetFlag(actor, 'enlageReduceSpell');
            await ChatMessage.create({ content: `${token.name} is returned to normal size` });
        }
    }

    static async eyebite(args) {
        if (!game.modules.get("dfreds-convenient-effects")?.active) { ui.notifications.error("Please enable the CE module"); return; }
        const { actor, token, lArgs } = MidiMacros.targets(args)
        const DAEItem = lArgs.efData.flags.dae.itemData

        function EyebiteDialog() {
            new Dialog({
                title: "Eyebite options",
                content: "<p>Target a token and select the effect</p>",
                buttons: {
                    one: {
                        label: "Asleep",
                        callback: async () => {
                            for (let t of game.user.targets) {
                                const flavor = `${CONFIG.DND5E.abilities["wis"]} DC${DC} ${DAEItem?.name || ""}`;
                                let saveRoll = (await actor.rollAbilitySave("wis", { flavor, fastFoward: true })).total;
                                if (saveRoll < DC) {
                                    await ChatMessage.create({ content: `${t.name} failed the save with a ${saveRoll}` });
                                    await MidiMacros.addDfred("Unconscious", actor);
                                }
                                else {
                                    await ChatMessage.create({ content: `${t.name} passed the save with a ${saveRoll}` });
                                }
                            }
                        }
                    },
                    two: {
                        label: "Panicked",
                        callback: async () => {
                            for (let t of game.user.targets) {
                                const flavor = `${CONFIG.DND5E.abilities["wis"]} DC${DC} ${DAEItem?.name || ""}`;
                                let saveRoll = (await actor.rollAbilitySave("wis", { flavor, fastFoward: true })).total;
                                if (saveRoll < DC) {
                                    await ChatMessage.create({ content: `${t.name} failed the save with a ${saveRoll}` });
                                    await MidiMacros.addDfred("Frightened", actor);
                                }
                                else {
                                    await ChatMessage.create({ content: `${t.name} passed the save with a ${saveRoll}` });
                                }
                            }
                        }
                    },
                    three: {
                        label: "Sickened",
                        callback: async () => {
                            for (let t of game.user.targets) {
                                const flavor = `${CONFIG.DND5E.abilities["wis"]} DC${DC} ${DAEItem?.name || ""}`;
                                let saveRoll = (await actor.rollAbilitySave("wis", { flavor, fastFoward: true })).total;
                                if (saveRoll < DC) {
                                    await ChatMessage.create({ content: `${t.name} failed the save with a ${saveRoll}` });
                                    await MidiMacros.addDfred("Poisoned", actor);
                                }
                                else {
                                    await ChatMessage.create({ content: `${t.name} passed the save with a ${saveRoll}` });
                                }
                            }
                        }
                    },
                }
            }).render(true);
        }

        if (args[0] === "on") {
            EyebiteDialog();
            await ChatMessage.create({ content: `${actor.name} is blessed with Eyebite` });
        }
        //Cleanup hooks and flags.
        if (args[0] === "each") {
            EyebiteDialog();
        }
    }

    static async findSteed(args) {
        if (!game.modules.get("warpgate")?.active) ui.notifications.error("Please enable the Warp Gate module")
        const { actor, token, lArgs } = MidiMacros.targets(args)
        if (!game.actors.getName("MidiSRD")) { await Actor.create({ name: "MidiSRD", type: "npc" }) }
        const menuData = {
            inputs: [{
                label: "Fey",
                type: "radio",
                options: "group1"
            },
            {
                label: "Fiend",
                type: "radio",
                options: "group1"
            },
            {
                label: "Celestial",
                type: "radio",
                options: "group1"
            }
            ],
            buttons: [{
                label: 'Warhorse',
                value: {
                    token: { name: "Warhorse" },
                    actor: { name: "Warhorse" },
                },
            },
            {
                label: 'Pony',
                value: {
                    token: { name: "Pony" },
                    actor: { name: "Pony" },
                },
            },
            {
                label: 'Camel',
                value: {
                    token: { name: "Camel" },
                    actor: { name: "Camel" },
                },
            },
            {
                label: 'Elk',
                value: {
                    token: { name: "Elk" },
                    actor: { name: "Elk" },
                },
            },
            {
                label: 'Mastiff',
                value: {
                    token: { name: "Mastiff" },
                    actor: { name: "Mastiff" },
                },
            },
            ], title: 'What type of steed?'
        };
        let pack = game.packs.get('dnd5e.monsters')
        await pack.getIndex()
        let dialog = await warpgate.menu(menuData);
        let index = pack.index.find(i => i.name === dialog.buttons.actor.name)
        let compendium = await pack.getDocument(index._id)

        let updates = {
            token: compendium.prototypeToken,
            actor: compendium.toObject()
        }
        updates.actor.system.details.type.value = dialog.inputs.find(i => !!i).toLowerCase()
        await warpgate.spawn("MidiSRD", updates, {}, { controllingActor: actor, });
    }

    static async fireShield(args) {
        const { actor, token, lArgs } = MidiMacros.targets(args)
        if (args[0] === "on") {
            new Dialog({
                title: "Warm or Cold Shield",
                buttons: {
                    one: {
                        label: "Warm",
                        callback: async () => {
                            let resistances = duplicate(actor.system.traits.dr.value);
                            resistances.push("cold");
                            await actor.update({ "system.traits.dr.value": resistances });
                            await DAE.setFlag(actor, 'FireShield', "cold");
                            await ChatMessage.create({ content: `${actor.name} gains resistnace to cold` });
                            await actor.createEmbeddedDocuments("Item", [{
                                "name": "Summoned Fire Shield",
                                "type": "weapon",
                                "img": "systems/dnd5e/icons/spells/protect-red-3.jpg",
                                "system": {
                                    "source": "Fire Shield Spell",
                                    "activation": {
                                        "type": "reactionmanual",
                                        "cost": 0,
                                        "condition": "whenever a creature within 5 feet of you hits you with a melee Attack"
                                    },
                                    "actionType": "other",
                                    "damage": {
                                        "parts": [
                                            [
                                                "2d8",
                                                "fire"
                                            ]
                                        ]
                                    },
                                    "weaponType": "natural"
                                },
                                "effects": []
                            }])
                        }
                    },
                    two: {
                        label: "Cold",
                        callback: async () => {
                            let resistances = duplicate(actor.system.traits.dr.value);
                            resistances.push("fire");
                            await actor.update({ "system.traits.dr.value": resistances });
                            await DAE.setFlag(actor, 'FireShield', "fire");
                            await ChatMessage.create({ content: `${actor.name} gains resistance to fire` });
                            await actor.createEmbeddedDocuments("Item", [{
                                "name": "Summoned Fire Shield",
                                "type": "weapon",
                                "img": "systems/dnd5e/icons/spells/protect-blue-3.jpg",
                                "system": {
                                    "source": "Fire Shield Spell",
                                    "activation": {
                                        "type": "special",
                                        "cost": 0,
                                        "condition": "whenever a creature within 5 feet of you hits you with a melee Attack"
                                    },
                                    "actionType": "other",
                                    "damage": {
                                        "parts": [
                                            [
                                                "2d8",
                                                "cold"
                                            ]
                                        ]
                                    },
                                    "weaponType": "natural"
                                },
                                "effects": []
                            }])
                        }
                    },
                }
            }).render(true);
        }
        if (args[0] === "off") {
            let item = actor.items.getName("Summoned Fire Shield")
            let element = DAE.getFlag(actor, 'FireShield');
            let resistances = actor.system.traits.dr.value;
            const index = resistances.indexOf(element);
            resistances.splice(index, 1);
            await actor.update({ "system.traits.dr.value": resistances });
            await ChatMessage.create({ content: "Fire Shield expires on " + actor.name });
            await DAE.unsetFlag(actor, 'FireShield');
            await actor.deleteEmbeddedDocuments("Item", [item.id])

        }
    }

    static async flameBlade(args) {
        if (!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")
        const { actor, token, lArgs } = MidiMacros.targets(args)
        const DAEItem = lArgs.efData.flags.dae.itemData

        if (args[0] === "on") {
            let weaponDamge = 2 + Math.floor(DAEItem.system.level / 2);
            await actor.createEmbeddedDocuments("Item",
                [{
                    "name": "Summoned Flame Blade",
                    "type": "weapon",
                    "system": {
                        "equipped": true,
                        "quantity": 1,
                        "activation": {
                            "type": "action",
                            "cost": 1,
                            "condition": ""
                        },
                        "target": {
                            "value": 1,
                            "width": null,
                            "units": "",
                            "type": "creature"
                        },
                        "range": {
                            "value": 5,
                        },
                        "ability": "",
                        "actionType": "msak",
                        "attackBonus": "0",
                        "damage": {
                            "parts": [
                                [
                                    `${weaponDamge}d6`,
                                    "fire"
                                ]
                            ],
                        },
                        "weaponType": "simpleM",
                        "proficient": true,
                    },
                    "flags": { "midi-srd": { "FlameBlade": { "ActorId": actor.id } } },
                    "img": DAEItem.img,
                    "effects": []
                }]
            );
            ui.notifications.notify("A Flame Blade appears in your inventory")
        }

        // Delete Flame Blade
        if (args[0] === "off") {
            await MidiMacros.deleteItems("FlameBlade", actor)
        }
    }

    static async fleshToStone(args) {
        if (!game.modules.get("dfreds-convenient-effects")?.active) { ui.notifications.error("Please enable the CE module"); return; }
        const { actor, token, lArgs } = MidiMacros.targets(args)
        const DAEItem = lArgs.efData.flags.dae.itemData
        const saveData = DAEItem.system.save
        let dc = args[1]

        if (args[0] === "on") {
            await MidiMacros.addDfred("Restrained", actor)
            await DAE.setFlag(actor, "FleshToStoneSpell", {
                successes: 0,
                failures: 1
            });
        }

        if (args[0] === "off") {
            await DAE.unsetFlag("world", "FleshToStoneSpell");
            await ChatMessage.create({ content: "Flesh to stone ends, if concentration was maintained for the entire duration,the creature is turned to stone until the effect is removed. " });
        }

        if (args[0] === "each") {
            let flag = DAE.getFlag(actor, "FleshToStoneSpell");
            if (flag.failures === 3) return;
            const flavor = `${CONFIG.DND5E.abilities[saveData.ability]} DC${dc} ${DAEItem?.name || ""}`;
            let saveRoll = (await actor.rollAbilitySave(saveData.ability, { flavor, fastForward: true })).total;

            if (saveRoll < dc) {
                if (flag.failures === 2) {
                    let fleshToStoneFailures = (flag.failures + 1);
                    await DAE.setFlag(actor, "FleshToStoneSpell", {
                        failures: fleshToStoneFailures
                    });
                    await ChatMessage.create({ content: `Flesh To Stone on ${actor.name} is complete` });
                    FleshToStoneUpdate();
                    return;
                }
                else {
                    let fleshToStoneFailures = (flag.failures + 1);
                    await DAE.setFlag(actor, "FleshToStoneSpell", {
                        failures: fleshToStoneFailures
                    });
                    console.log(`Flesh To Stone failures increments to ${fleshToStoneFailures}`);
                }
            }
            else if (saveRoll >= dc) {
                if (flag.successes === 2) {
                    await ChatMessage.create({ content: `Flesh To Stone on ${actor.name} ends` });
                    await actor.deleteEmbeddedDocuments("ActiveEffect", [lArgs.effectId]);
                    await MidiMacros.addDfred("Restrained", actor)
                    return;
                }
                else {
                    let fleshToStoneSuccesses = (flag.successes + 1);
                    await DAE.setFlag(actor, "FleshToStoneSpell", {
                        successes: fleshToStoneSuccesses
                    });
                    console.log(`Flesh To Stone successes to ${fleshToStoneSuccesses}`);
                }
            }
        }

        async function FleshToStoneUpdate() {
            let fleshToStone = actor.effects.get(lArgs.effectId);
            let icon = fleshToStone.icon;
            if (game.modules.get("dfreds-convenient-effects").active) icon = "modules/dfreds-convenient-effects/images/petrified.svg";
            else icon = "icons/svg/paralysis.svg"
            let label = fleshToStone.label;
            label = "Flesh to Stone - Petrified";
            let time = fleshToStone.duration.seconds
            time = 60000000
            await fleshToStone.update({ icon, label, time });
        }
    }

    static async giantInsect(args) {
        if (!game.modules.get("warpgate")?.active) ui.notifications.error("Please enable the Warp Gate module")
        const { actor, token, lArgs } = MidiMacros.targets(args)
        if (args[0] === "on") {
            if (!game.actors.getName("MidiSRD")) { await Actor.create({ name: "MidiSRD", type: "npc" }) }
            const buttonData = {
                buttons: [{
                    label: 'Centipedes',
                    value: {
                        token: { name: "Giant Centipede" },
                        actor: { name: "Giant Centipede" },
                        cycles: 10
                    }
                },
                {
                    label: 'Spiders',
                    value: {
                        token: { name: "Giant Spider" },
                        actor: { name: "Giant Spider" },
                        cycles: 3
                    }
                }, {
                    label: 'Wasps',
                    value: {
                        token: { name: "Giant Wasp" },
                        actor: { name: "Giant Wasp" },
                        cycles: 5
                    }
                }, {
                    label: 'Scorpion',
                    value: {
                        token: { name: "Giant Scorpion" },
                        actor: { name: "Giant Scorpion" },
                        cycles: 1
                    }
                },
                ], title: 'Which type of insect?'
            };
            let pack = game.packs.get('dnd5e.monsters')
            await pack.getIndex()
            let dialog = await warpgate.buttonDialog(buttonData);
            let index = pack.index.find(i => i.name === dialog.actor.name)
            let compendium = await pack.getDocument(index._id)

            let updates = {
                token: compendium.prototypeToken,
                actor: compendium.toObject()
            }
            updates.token.flags["midi-srd"] = { "GiantInsect": { ActorId: actor.id } }
            await warpgate.spawn("MidiSRD", updates, {}, { controllingActor: actor, duplicates: dialog.cycles });
        }
        if (args[0] === "off") {
            MidiMacros.deleteTokens("GiantInsect", actor)
        }
    }

    static async invisibility(args) {
        const { actor, token, lArgs } = MidiMacros.targets(args)
        if (args[0] === "on") {
            await ChatMessage.create({ content: `${token.name} turns invisible`, whisper: [game.user] });
            await token.document.update({ "hidden": true });
        }
        if (args[0] === "off") {
            await ChatMessage.create({ content: `${token.name} re-appears`, whisper: [game.user] });
            await token.document.update({ "hidden": false });
        }
    }

    static async heroism(args) {
        const { actor, token, lArgs } = MidiMacros.targets(args)
        let mod = args[1];
        if (args[0] === "on") {
            await ChatMessage.create({ content: `Heroism is applied to ${actor.name}` })
        }
        if (args[0] === "off") {
            await ChatMessage.create({ content: "Heroism ends" });
        }
        if (args[0] === "each") {
            let bonus = mod > actor.system.attributes.hp.temp ? mod : actor.system.attributes.hp.temp
            await actor.update({ "system.attributes.hp.temp": mod });
            await ChatMessage.create({ content: "Heroism continues on " + actor.name })
        }
    }

    static async laughter(args) {
        const { actor, token, lArgs } = MidiMacros.targets(args)
        const DAEItem = lArgs.efData.flags.dae.itemData
        const saveData = DAEItem.system.save

        let caster = canvas.tokens.placeables.find(token => token?.actor?.items.get(DAEItem._id) != null)

        if (args[0] === "on") {
            if (actor.system.abilities.int.value < 4) actor.deleteEmbeddedDocuments("ActiveEffect", [lArgs.efData._id])
            RollHideousSave(args[1])
        }

        async function RollHideousSave(target) {
            console.log("SetHook")
            const hookId = Hooks.on("preUpdateActor", async (actor, update) => {
                if (!"actorData.system.attributes.hp" in update) return;
                let oldHP = actor.system.attributes.hp.value;
                let newHP = getProperty(update, "system.attributes.hp.value");
                let hpChange = oldHP - newHP
                if (hpChange > 0 && typeof hpChange === "number") {
                    const flavor = `${CONFIG.DND5E.abilities["wis"]} DC${saveData.dc} ${DAEItem?.name || ""}`;
                    let saveRoll = (await actor.rollAbilitySave(saveData.ability, { flavor, fastForward: true, advantage: true })).total;
                    if (saveRoll < saveData.dc) return;
                    await actor.deleteEmbeddedDocuments("ActiveEffect", [lArgs.efData._id])

                }
            })
            if (args[0] !== "on") {
                const flavor = `${CONFIG.DND5E.abilities["wis"]} DC${saveData.dc} ${DAEItem?.name || ""}`;
                let saveRoll = (await actor.rollAbilitySave(saveData.ability, { flavor })).total;
                if (saveRoll >= saveData.dc) {
                    actor.deleteEmbeddedDocuments("ActiveEffect", [lArgs.efData._id])
                }
            }
            await DAE.setFlag(actor, "hideousLaughterHook", hookId)
        }

        async function RemoveHook() {
            let flag = await DAE.getFlag(actor, 'hideousLaughterHook');
            Hooks.off("preUpdateActor", flag);
            await DAE.unsetFlag(actor, "hideousLaughterHook");
            if (args[0] === "off") game.cub?.addCondition("Prone", actor)
        }

        if (args[0] === "off") {
            RemoveHook()
        }

        if (args[0] === "each") {
            await RemoveHook()
            await RollHideousSave()
        }
    }

    static async dance(args) {
        const { actor, token, lArgs } = MidiMacros.targets(args)
        const DAEItem = lArgs.efData.flags.dae.itemData
        const saveData = DAEItem.system.save
        const DC = args[1]

        if (args[0] === "each") {
            new Dialog({
                title: "Use action to make a wisdom save to end Irresistible Dance?",
                buttons: {
                    one: {
                        label: "Yes",
                        callback: async () => {
                            const flavor = `${CONFIG.DND5E.abilities[saveData.ability]} DC${DC} ${DAEItem?.name || ""}`;
                            let saveRoll = (await actor.rollAbilitySave(saveData.ability, { flavor })).total;

                            if (saveRoll >= DC) {
                                await actor.deleteEmbeddedDocuments("ActiveEffect", [lArgs.effectId]);
                            }
                            if (saveRoll < DC) {
                                await ChatMessage.create({ content: `${actor.name} fails the save` });
                            }
                        }
                    },
                    two: {
                        label: "No",
                        callback: () => {
                        }
                    }
                }
            }).render(true);
        }
    }

    static async levitate(args) { //done -maybe stylze the dialog better
        if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
        const initialMutName = "levitationActivation"
        if (args[0] !== "off" && args[0] !== "on") {
            const { macroPass, actor, tokenUuid, item, targets } = args[0] ?? {};
            if(!args[0]) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM and un-check Item Macros Sheet Hooks option");
            if (!targets.length) return ui.notifications.error("Please select a target");

            const tokenDoc = fromUuidSync(tokenUuid);
            const targetDoc = targets[0];
            const initialTargetUuid = DAE.getFlag(tokenUuid,'levitateMidiSRDTarget');

            if (macroPass === "preItemRoll") {
                console.log(args[0].targets)
                
                if (!initialTargetUuid || initialTargetUuid === targetDoc.uuid) return true;
                else {  //if (initialTargetUuid !== targetDoc.uuid)
                    await warpgate.revert(tokenDoc,initialMutName)
                    await actor.effects.find(eff=>eff.label.toLocaleLowerCase().includes("concentrating"))?.delete()
                }
            }
            if (macroPass === "postActiveEffects") {
                if (!initialTargetUuid || initialTargetUuid !== targetDoc.uuid) await DAE.setFlag(tokenUuid,'levitateMidiSRDTarget',targetDoc.uuid);
                const content = `<label for="elev"><b><center>Would that be up or down?</center></b></label><br />
                                    <input type="range" step="1" min="-20" max="20" id="elev" name="feet" list="values" />
                                <center><b>Selected value: <output id="value"> ft</output></center></b>
                                <datalist id="values">
                                    <option value="-20" label="-20"></option>
                                    <option value="-10" label="-10"></option>
                                    <option value="0" label="0"></option>
                                    <option value="10" label="10"></option>
                                    <option value="20" label="20"></option>
                                </datalist>`
                const result = await Dialog.wait({ 
                    title: "Let's Float!", 
                    content: content, 
                    default:"no",
                    close: () => {return false},
                    render:() => {
                        const value = document.querySelector("#value")
                        const input = document.querySelector("#elev")
                        value.textContent = input.value
                        input.addEventListener("input", (event) => {
                            value.textContent = event.target.value
                        })
                    },
                    buttons: {
                        yes: {
                            icon: '<i class="fas fa-check"></i>',
                            label: "Float",
                            callback: () => {
                                const ft = document.querySelector("#elev").value
                                return ft;
                            }
                        },
                        no: {
                            icon: '<i class="fas fa-times"></i>',
                            label: "Stop concentrating",
                            callback: async () => {
                                await actor.effects.find(eff=>eff.label.toLocaleLowerCase().includes("concentrating"))?.delete();
                                return false;
                            }
                        }
                    },
                    rejectClose: false
                });
                if (result) {
                    const targetUpdates = targetDoc.actor.effects.find(eff=>eff.label === "Levitating") 
                        ? {token: {elevation: Number(targetDoc.elevation) + Number(result)}}
                        : {embedded: {
                            ActiveEffect:{
                                ["Levitating"]: {
                                    duration: {startTime:game.time.worldTime, seconds:600, startRound:game.combat?.round,startTurn:game.combat?.turn},
                                    icon: "icons/magic/control/debuff-energy-hold-levitate-pink.webp",
                                    label: "Levitating",
                                    origin: item.uuid
                                }
                            }
                        },
                        token: {elevation: Number(targetDoc.elevation) + Number(result)}
                        }
                    await warpgate.mutate(targetDoc,targetUpdates,{},{permanent:true});
                    await ChatMessage.create({ content: `${targetDoc.name} floats at ${targetDoc.elevation} ft` });
                }
                if (!result || MidiMacros.hasMutation(tokenDoc,initialMutName)) return;
                const effectUuid = targetDoc.actor.effects.find(eff=>eff.label==="Levitating").uuid;
                const activation = targetDoc.uuid === tokenUuid ? {type:'special',cost:''} : item.system.activation;
                let casterUpdates = {
                    embedded: {
                        Item: {
                            [item.name]: {
                                name: item.name + ' activated',
                                system: {
                                    actionType: 'other',
                                    activation,
                                    components:{concentration:false},
                                    level: 0,
                                    preparation: {mode: 'atwill', prepared: true},
                                    save: {ability: '', dc: '', scaling: ''},
                                    uses: {value: null, max: '', per: '', recovery: ''}
                                },
                            }
                        },
                    },
                    actor: {
                        flags: {
                            ["midi-qol"]: {
                                ["concentration-data"]: {removeUuids:[effectUuid]}
                            },
                            dae: { levitateMidiSRDTarget: targetDoc.uuid }
                        }
                    }
                }
                await warpgate.mutate(tokenDoc,casterUpdates,{},{name:initialMutName});
                casterUpdates = {embedded: {ActiveEffect:{["Concentrating"]:{changes:[{key:"macro.itemMacro",mode:0,value:"ItemMacro.Levitate activated"}]}}}}; //update due to comparisonkey present
                await warpgate.mutate(tokenDoc,casterUpdates,{},{permanent:true});
            }
        }        
        if (args[0] === "off") {  //the off is when the concentration effect is deleted on the caster.
            const { actor, token, lArgs } = MidiMacros.targets(args) ?? {};
            if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
            const targetDoc = fromUuidSync(DAE.getFlag(token.document.uuid,'levitateMidiSRDTarget'));
            await warpgate.mutate(targetDoc,{token:{elevation: 0}},{},{permanent:true});
            await ChatMessage.create({ content: `${targetDoc.name} is returned to the ground` });
            return await warpgate.revert(token.document,initialMutName);
        }
    }

    static async magicWeapon(args) {
        //DAE Item Macro Execute, arguments = @item.level
        const { actor, token, lArgs } = MidiMacros.targets(args)
        const DAEItem = lArgs.efData.flags.dae.itemData

        let weapons = actor.itemTypes.weapon
        let weapon_content = ``;

        function value_limit(val, min, max) {
            return val < min ? min : (val > max ? max : val);
        };
        //Filter for weapons
        for (let weapon of weapons) {
            weapon_content += `<label class="radio-label">
                <input type="radio" name="weapon" value="${weapon.id}">
                <img src="${weapon.img}" style="border:0px; width: 50px; height:50px;">
                ${weapon.name}
            </label>`;
        }

        /**
         * Select for weapon and apply bonus based on spell level
         */
        if (args[0] === "on") {
            let content = `
                <form class="magicWeapon">
                <div class="form-group" id="weapons">
                    ${weapon_content}
                </div>
                </form>
                `;

            new Dialog({
                content,
                buttons:
                {
                    Ok:
                    {
                        label: `Ok`,
                        callback: async (html) => {
                            let itemId = $("input[type='radio'][name='weapon']:checked").val();
                            let weaponItem = actor.items.get(itemId);
                            let copy_item = duplicate(weaponItem);
                            let spellLevel = Math.floor(DAEItem.system.level / 2);
                            let bonus = value_limit(spellLevel, 1, 3);
                            let wpDamage = copy_item.system.damage.parts[0][0];
                            let verDamage = copy_item.system.damage.versatile;
                            await DAE.setFlag(actor, `magicWeapon`, {
                                damage: weaponItem.system.attackBonus,
                                weapon: itemId,
                                weaponDmg: wpDamage,
                                verDmg: verDamage,
                                mgc: copy_item.system.properties.mgc
                            }
                            );
                            if (copy_item.system.attackBonus === "") copy_item.system.attackBonus = "0"
                            copy_item.system.attackBonus = `${parseInt(copy_item.system.attackBonus) + bonus}`;
                            copy_item.system.damage.parts[0][0] = (wpDamage + " + " + bonus);
                            copy_item.system.properties.mgc = true
                            if (verDamage !== "" && verDamage !== null) copy_item.system.damage.versatile = (verDamage + " + " + bonus);
                            await actor.updateEmbeddedDocuments("Item", [copy_item]);
                        }
                    },
                    Cancel:
                    {
                        label: `Cancel`
                    }
                }
            }).render(true);
        }

        //Revert weapon and unset flag.
        if (args[0] === "off") {
            let { damage, weapon, weaponDmg, verDmg, mgc } = DAE.getFlag(actor, 'magicWeapon');
            let weaponItem = actor.items.get(weapon);
            let copy_item = duplicate(weaponItem);
            copy_item.system.attackBonus = damage;
            copy_item.system.damage.parts[0][0] = weaponDmg;
            copy_item.system.properties.mgc = mgc
            if (verDmg !== "" && verDmg !== null) copy_item.system.damage.versatile = verDmg;
            await actor.updateEmbeddedDocuments("Item", [copy_item]);
            await DAE.unsetFlag(actor, `magicWeapon`);
        }
    }

    static async mistyStep(args) {
        //DAE Macro Execute, Effect Value = "Macro Name" @target 
        if (!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")
        const { actor, token, lArgs } = MidiMacros.targets(args)
        if (args[0] === "on") {
            let range = canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [{
                t: "circle",
                user: game.user.id,
                x: token.x + canvas.grid.size / 2,
                y: token.y + canvas.grid.size / 2,
                direction: 0,
                distance: 30,
                borderColor: "#FF0000",
                flags: { "midi-srd": { MistyStep: { ActorId: actor.id } } }
            }]);
            range.then(result => {
                let templateData = {
                    t: "rect",
                    user: game.user.id,
                    distance: 7.5,
                    direction: 45,
                    x: 0,
                    y: 0,
                    fillColor: game.user.color,
                    flags: { "midi-srd": { MistyStep: { ActorId: actor.id } } }
                };
                Hooks.once("createMeasuredTemplate", deleteTemplatesAndMove);
                MidiMacros.templateCreation(templateData, actor)
                async function deleteTemplatesAndMove(template) {
                    MidiMacros.deleteTemplates("MistyStep", actor)
                    await token.document.update({ x: template.document.x, y: template.document.y }, { animate: false })
                    await actor.deleteEmbeddedDocuments("ActiveEffect", [lArgs.effectId]);
                };
            });
        }
    }

    static async moonbeam(args) {
        //DAE Item Macro Execute, Effect Value = @attributes.spelldc
      //  if (!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")
        const { actor, token, lArgs } = MidiMacros.targets(args)
        const DAEItem = lArgs.efData.flags.dae.itemData
        const saveData = DAEItem.system.save
        const DC = args[1]

        if (args[0] === "on") {
            let range = canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [{
                t: "circle",
                user: game.user.id,
                x: token.x + canvas.grid.size / 2,
                y: token.y + canvas.grid.size / 2,
                direction: 0,
                distance: 60,
                borderColor: "#517bc9",
                flags: { "midi-srd": { MoonbeamRange: { ActorId: actor.id } } }
            }]);
            range.then(result => {
                let templateData = {
                    t: "circle",
                    user: game.user.id,
                    distance: 5,
                    direction: 0,
                    x: 0,
                    y: 0,
                    flags: {
                        "midi-srd": { Moonbeam: { ActorId: actor.id } }
                    },
                    fillColor: game.user.color
                }
                Hooks.once("createMeasuredTemplate", () => {MidiMacros.deleteTemplates("MoonbeamRange", actor)});
                MidiMacros.templateCreation(templateData, actor)
            })
            let damage = DAEItem.system.level;
            await actor.createEmbeddedDocuments("Item",
                [{
                    "name": "Moonbeam repeating",
                    "type": "spell",
                    "system": {
                        "source": "Casting Moonbeam",
                        "ability": "",
                        "description": {
                            "value": "half damage on save"
                        },
                        "actionType": "save",
                        "attackBonus": 0,
                        "damage": {
                            "parts": [[`${damage}d10`, "radiant"]],
                        },
                        "formula": "",
                        "save": {
                            "ability": "con",
                            "dc": saveData.dc,
                            "scaling": "spell"
                        },
                        "level": 0,
                        "school": "abj",
                        "preparation": {
                            "mode": "atwill",
                            "prepared": true
                        },

                    },
                    "flags": { "midi-srd": { "Moonbeam": { "ActorId": actor.id } } },
                    "img": DAEItem.img,
                    "effects": []
                }]
            );
        }
        if (args[0] === "off") {
            await MidiMacros.deleteItems("Moonbeam", actor)
            await MidiMacros.deleteTemplates("Moonbeam", actor)
        }
    }

    static async protectionFromEnergy(args) {
        const { actor, token, lArgs } = MidiMacros.targets(args)
        let content = `
    <form class="protEnergy">
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
          </form>
`

        if (args[0] === "on") {
            new Dialog({
                title: 'Choose a damage type',
                content: content,
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: 'Yes',
                        callback: async (html) => {
                            let element = $("input[type='radio'][name='type']:checked").val();
                            let resistances = actor.system.traits.dr.value;
                            resistances.push(element);
                            await actor.update({ "system.traits.dr.value": resistances });
                            await DAE.setFlag(actor, 'ProtectionFromEnergy', element);
                            await ChatMessage.create({ content: `${actor.name} gains resistance to ${element}` });
                        }
                    },
                },
            }).render(true, { width: 400 });
        }
        if (args[0] === "off") {
            let element = DAE.getFlag(actor, 'ProtectionFromEnergy');
            let resistances = actor.system.traits.dr.value;
            const index = resistances.indexOf(element);
            resistances.splice(index, 1);
            await actor.update({ "system.traits.dr.value": resistances });
            await DAE.unsetFlag(actor, 'ProtectionFromEnergy');
            await ChatMessage.create({ content: `${actor.name} loses resistance to ${element}` });
        }
    }

    static async rayOfEnfeeblement(args) {
        if (!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")
        const { actor, token, lArgs } = MidiMacros.targets(args)
        let weapons = actor.itemTypes.weapon;

        /**
         * For every str weapon, update the damage formulas to half the damage, set flag of original
         */
        if (args[0] === "on") {
            for (let weapon of weapons) {
                if (weapon.abilityMod === "str") {
                    let newWeaponParts = duplicate(weapon.system.damage.parts);
                    await weapon.setFlag('world', 'RayOfEnfeeblement', newWeaponParts);
                    for (let part of weapon.system.damage.parts) {
                        part[0] = `floor((${part[0]})/2)`;
                    }
                    await weapon.update({ "system.damage.parts": weapon.system.damage.parts });
                }
            }
        }

        // Update weapons to old value
        if (args[0] === "off") {
            for (let weapon of weapons) {
                let parts = weapon.getFlag('world', 'RayOfEnfeeblement');
                await weapon.update({ "system.damage.parts": parts });
            }
        }
    }

    static async regenerate(args) {
        const { actor, token, lArgs } = MidiMacros.targets(args)
        /**
         * Set hooks to fire on combat update and world time update
         */
        if (args[0] === "on") {

            // If 6s elapses, update HP by one
            const timeHookId = Hooks.on("updateWorldTime", async (currentTime, updateInterval) => {
                let effect = actor.effects.find(i => i.label === "Regenerate");
                let applyTime = effect.duration.startTime;
                let expireTime = applyTime + effect.duration.seconds;
                let healing = roundCount(currentTime, updateInterval, applyTime, expireTime);
                await actor.applyDamage(-healing);
                await ChatMessage.create({ content: `${actor.name} gains 1 hp` });
            }
            );

            actor.setFlag("world", "Regenerate", {
                timeHook: timeHookId
            }
            );
        }

        if (args[0] === "off") {
            async function RegenerateOff() {
                let flag = await actor.getFlag('world', 'Regenerate');
                Hooks.off("updateWorldTime", flag.timeHook);
                await actor.unsetFlag("world", "Regenerate");
                console.log("Regenerate removed");
            };
            RegenerateOff();
        }


        /**
         * 
         * @param {Number} currentTime current world time
         * @param {Number} updateInterval amount the world time was incremented
         * @param {Number} applyTime time the effect was applied
         * @param {Number} expireTime time the effect should expire
         */
        function roundCount(currentTime, updateInterval, applyTime, expireTime) {
            // Don't count time before applyTime
            if (currentTime - updateInterval < applyTime) {
                let offset = applyTime - (currentTime - updateInterval);
                updateInterval -= offset;
            }
            await
            // Don't count time after expireTime
            if (currentTime > expireTime) {
                let offset = currentTime - expireTime;
                currentTime = expireTime;
                updateInterval -= offset;
            }

            let sTime = currentTime - updateInterval;
            let fRound = sTime + 6 - (sTime % 6); // Time of the first round
            let lRound = currentTime - (currentTime % 6); // Time of the last round
            let roundCount = 0;
            if (lRound >= fRound)
                roundCount = (lRound - fRound) / 6 + 1;

            return roundCount;
        }
    }

    static async shillelagh(args) {  //@to-do: STR/DEX or general spellcasting.mod
        const { actor, token, lArgs } = MidiMacros.targets(args)
        // we see if the equipped weapons have base weapon set and filter on that, otherwise we just get all weapons
        const filteredWeapons = actor.items
            .filter((i) => i.type === "weapon" && (i.system.baseItem === "club" || i.system.baseItem === "quarterstaff"));
        const weapons = (filteredWeapons.length > 0)
            ? filteredWeapons
            : actor.itemTypes.weapon;

        const weapon_content = weapons.map((w) => `<option value=${w.id}>${w.name}</option>`).join("");

        if (args[0] === "on") {
            const content = `
                <div class="form-group">
                <label>Weapons : </label>
                <select name="weapons">
                ${weapon_content}
                </select>
                </div>
                `;

            new Dialog({
                title: "Choose a club or quarterstaff",
                content,
                buttons: {
                    Ok: {
                        label: "Ok",
                        callback: async (html) => {
                            const itemId = html.find("[name=weapons]")[0].value;
                            const weaponItem = actor.getEmbeddedDocument("Item", itemId);
                            const weaponCopy = duplicate(weaponItem);
                            await DAE.setFlag(actor, "shillelagh", {
                                id: itemId,
                                name: weaponItem.name,
                                damage: weaponItem.system.damage.parts[0][0],
                                ability: weaponItem.system.ability,
                                magical: getProperty(weaponItem, "system.properties.mgc") || false,
                            });
                            const damage = weaponCopy.system.damage.parts[0][0];
                            const targetAbilities = actor.system.abilities;
                            weaponCopy.system.damage.parts[0][0] = damage.replace(/1d(4|6)/g, "1d8");
                            if (targetAbilities.wis.value > targetAbilities.str.value) weaponCopy.system.ability = "wis";
                            weaponCopy.name = weaponItem.name + " [Shillelagh]";
                            setProperty(weaponCopy, "system.properties.mgc", true);
                            await actor.updateEmbeddedDocuments("Item", [weaponCopy]);
                            await ChatMessage.create({
                                content: weaponCopy.name + " is empowered by Shillelagh",
                            });
                        },
                    },
                    Cancel: {
                        label: `Cancel`,
                    },
                },
            }).render(true);
        }

        if (args[0] === "off") {
            const flag = DAE.getFlag(actor, "shillelagh");
            const weaponItem = actor.getEmbeddedDocument("Item", flag.id);
            const weaponCopy = duplicate(weaponItem);
            weaponCopy.system.damage.parts[0][0] = flag.damage;
            weaponCopy.system.ability = flag.ability;
            weaponCopy.name = flag.name;
            setProperty(weaponCopy, "system.properties.mgc", flag.magical);
            await actor.updateEmbeddedDocuments("Item", [weaponCopy]);
            await DAE.unsetFlag(target, "shillelagh");
            await ChatMessage.create({ content: weaponCopy.name + " returns to normal" });
        }
    }

    static async spiritualWeapon(args, texture) {
        const { actor, token, lArgs } = MidiMacros.targets(args)
        const castingItem = lArgs.efData.flags.dae.itemData
        if (args[0] === "on") {
            let damage = Math.floor(Math.floor(args[1] / 2));
            let image = castingItem.img;
            let range = canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [{
                t: "circle",
                user: game.user.id,
                x: token.x + canvas.grid.size / 2,
                y: token.y + canvas.grid.size / 2,
                direction: 0,
                distance: 60,
                borderColor: "#FF0000",
                flags: { "midi-srd": { SpiritualWeaponRange: { ActorId: actor.id } } }
            }]);
            range.then(result => {
                let templateData = {
                    t: "rect",
                    user: game.user.id,
                    distance: 7,
                    direction: 45,
                    texture: texture || "",
                    x: 0,
                    y: 0,
                    flags: { "midi-srd": { SpiritualWeapon: { ActorId: actor.id } } },
                    fillColor: game.user.color
                }
                Hooks.once("createMeasuredTemplate", () => {MidiMacros.deleteTemplates("SpiritualWeaponRange", actor)});
                MidiMacros.templateCreation(templateData, actor)
            })
            await actor.createEmbeddedDocuments("Item",
                [{
                    "name": "Summoned Spiritual Weapon",
                    "type": "weapon",
                    "system": {
                        "equipped": true,
                        "identified": true,
                        "activation": {
                            "type": "bonus",
                        },
                        "target": {
                            "value": 1,
                            "width": null,
                            "type": "creature"
                        },
                        "ability": args[2],
                        "actionType": "msak",
                        "attackBonus": "",
                        "chatFlavor": "",
                        "critical": null,
                        "damage": {
                            "parts": [[`${damage}d8+@mod`, "force"]],
                        },
                        "weaponType": "simpleM",
                        "proficient": true
                    },
                    "flags": { "midi-srd": { "SpiritualWeapon": { "ActorId": actor.id } } },
                    "img": `${image}`,
                    "effects": []
                }],
            );
            ui.notifications.notify("Weapon created in your inventory")
        }
        if (args[0] === "off") {
            await MidiMacros.deleteItems("SpiritualWeapon", actor)
            await MidiMacros.deleteTemplates("SpiritualWeapon", actor)
        }
    }

    static async unseenServant(args, texture) {
        if (!game.modules.get("warpgate")?.active) ui.notifications.error("Please enable the Warp Gate module")
        const { actor, token, lArgs } = MidiMacros.targets(args)
        if (!game.actors.getName("MidiSRD")) { await Actor.create({ name: "MidiSRD", type: "npc" }) }
        texture = texture || lArgs.item.img
        let updates = {
            token: {
                "name": "Unseen Servant", "img": texture
            },
            actor: {
                "name": "Unseen Servant",
                "system.attributes": { "ac.value": 10, "hp.value": 1 },
                "system.abilities.str.value" : 2
            }
        }
        let { x, y } = await MidiMacros.warpgateCrosshairs(token, 60, "Unseen Servant", texture, {}, -1)

        await warpgate.spawnAt({ x, y }, "MidiSRD", updates, { controllingActor: actor },);

    }
    static async wardingBond(args) {
        //DAE Macro Execute, Effect Value = "Macro Name" @target @item
        const { actor, token, lArgs } = MidiMacros.targets(args)
        const DAEItem = lArgs.efData.flags.dae.itemData
        let caster = canvas.tokens.placeables.find(token => token?.actor?.items.get(DAEItem._id) != null)
        if (args[0] === "on") {
            await DAE.setFlag(actor, "WardingBondIds", {
                tokenID: actor.id,
                casterID: caster.actor.id
            })
            SetWardingBondHook(token)
        }

        async function SetWardingBondHook(token) {
            const hookId = Hooks.on("preUpdateActor", async (actor, update) => {
                let flag = await DAE.getFlag(actor, "WardingBondIds")
                if (flag.tokenID !== actor.id) return
                if (!"actorData.system.attributes.hp" in update) return;
                let oldHP = actor.system.attributes.hp.value;
                let newHP = getProperty(update, "system.attributes.hp.value");
                let hpChange = oldHP - newHP
                if (hpChange > 0 && typeof hpChange === "number") {
                    let caster = game.actors.get(flag.casterID).getActiveTokens()[0]
                    caster.actor.applyDamage(hpChange)
                }
            })
            await DAE.setFlag(actor, "WardingBondHook", hookId)
        }

        async function RemoveHook() {
            let flag = await DAE.getFlag(actor, 'WardingBondHook');
            Hooks.off("preUpdateActor", flag);
            await DAE.unsetFlag(actor, "WardingBondHook");
        }

        if (args[0] === "off") {
            RemoveHook()
            await DAE.unsetFlag(actor, "WardingBondIds");
            console.log("Death Ward removed");
        }

        if (args[0] === "each") {
            await RemoveHook()
            await SetWardingBondHook()
        }
    }
}

window.MidiMacros = MidiMacros
