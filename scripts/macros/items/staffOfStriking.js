export async function staffOfStriking(args) {
    const {macroPass,isCritical,workflow,workflow:{item}} = args[0] ?? {};
    if (!macroPass || !item || !workflow) return ui.notifications.error("Staff of Striking error, please notify GM!");

    //here we opt out of using charges of the Item when initially rolling it.
    if (macroPass === "preItemRoll") {  
        workflow.config.consumeUsage = false;
        workflow.config.needsConfiguration = false;
        workflow.options.configureDialog = false;
        return true;
    }

    //here we post the dialog for the extra damage and if accept the use of one of the available charges, add the extra damage.
    else if (macroPass === "DamageBonus") {
        const charges = item.system.uses.value;
        if (!charges) return;
        const labels = ["None", "One", "Two", "Three"];
        const content = `<center>How many charges? Available: ${charges}</center>`

        const damageDice = await Dialog.wait({
            title : "Staff of Striking Charges" , 
            content,
            buttons: Array.fromRange(Math.min(4,Number(charges)+1)).map(i=>({label:labels[i], callback: (html) => {
                    return i;               
            }})),
            close:()=>false
        })
        
        if(!damageDice) return {};
        await item.update({"system.uses.value": charges - damageDice});
        const damageFormula = new CONFIG.Dice.DamageRoll(`${damageDice}d6[force]`, {}, {
            critical: isCritical ?? false, 
            powerfulCritical: game.settings.get("dnd5e", "criticalDamageMaxDice"),
            multiplyNumeric: game.settings.get("dnd5e",  "criticalDamageModifiers")
        }).formula
        return {damageRoll: damageFormula, flavor: "Striking Damage!"};
    }
}