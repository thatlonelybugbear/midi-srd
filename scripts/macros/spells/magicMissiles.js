import * as MidiSRDHelpers from '../../helpers/helpers.mjs';
export async function magicMissiles(args) {
	if (!args || !args[0].targets.length) return ui.notifications.error("Please select at least 1 target | or get the MidiSRD spell | or deselect Sheet Hooks in Item Macros module settings");
	const level = 2 + Number(args[0].spellLevel);
	if (args[0].targets.length === 1){
		const {token,actor,targets,itemCardId} = args[0];
		const target = targets[0];
		const damageRoll = await new Roll(`(1d4[force]+1)*${level}`).evaluate({async:true});
		await game.dice3d?.showForRoll(damageRoll,game.user,true);
		await new MidiQOL.DamageOnlyWorkflow(actor, token, damageRoll.total, "force", [target], damageRoll, {itemCardId})
		const damage_target = `<div class="midi-qol-flex-container"><div>hits</div><div class="midi-qol-target-npc midi-qol-target-name" id="${target.id}"> ${target.name}</div><div><img src="${target.texture.src}" width="30" height="30" style="border:0px"></div></div>`;
		await wait(1000);
		const damage_results = `<div><div class="midi-qol-nobox">${damage_target}</div></div>`;
		const chatMessage = await game.messages.get(itemCardId);
		let content = await duplicate(chatMessage.content);
		const searchString =  '<div class="midi-qol-hits-display"><div class="end-midi-qol-hits-display"></div></div>';
		const replaceString = `<div class="midi-qol-hits-display"><div class="end-midi-qol-hits-display">${damage_results}</div></div>`;
		content = await content.replace(searchString, replaceString);
		await chatMessage.update({content: content});
	}
	if (args[0].targets.length > 1){
		let targetList = "";
		let all_targets = args[0].targets;
		for (let target of all_targets) {
			targetList += `<tr><td>${target.name}</td><td><input type="num" id="target" min="0" max="${level}" name="${target.id}"></td></tr>`;
		}
		const the_content = `<p>You have currently <b>${level}</b> total Magic Missle bolts.</p><form class="flexcol"><table width="100%"><tbody><tr><th>Target</th><th>Number Bolts</th></tr>${targetList}</tbody></table></form>`;
		new Dialog({
			title: "Magic Missle Damage",
			content: the_content,
			buttons: {
			one: { label: "Damage", callback: async (html) => {
				let spentTotal = 0;
				const selected_targets = html.find('input#target');
				for(let get_total of selected_targets){
					spentTotal += Number(get_total.value);
				}
				if (spentTotal > level) return ui.notifications.error(`The spell fails, You assigned more bolts then you have.`);
				let damage_target = [];
				const damageRoll = await new Roll("1d4+1[force]").evaluate({async:true});
                await game.dice3d?.showForRoll(damageRoll,game.user,true);
				for(let selected_target of selected_targets){
					let damageNum = selected_target.value;
					if (damageNum != null){
						const target_id = selected_target.name;
						const get_target = canvas.tokens.get(target_id);
						const totalDamage = damageNum * damageRoll.total;
						await MidiQOL.applyTokenDamage([{damage:totalDamage, damageType:"force"}],totalDamage,new Set([get_target]), args[0].item, null,{});
						damage_target.push(`<div class="midi-qol-flex-container"><div>${damageNum} missile(s) hit</div><div class="midi-qol-target-npc midi-qol-target-name" id="${get_target.id}"> ${get_target.name}</div><div><img src="${get_target.document.texture.src}" width="30" height="30" style="border:0px"></div> for ${totalDamage} HPs</div>`);
					}
				}
				const damage_list = damage_target.join('');
				const damage_results = `<div><div class="midi-qol-nobox">${damage_list}</div></div>`;
				const chatMessage = await game.messages.get(args[0].itemCardId);
				let content = duplicate(chatMessage.content);
				const replaceString = `<div class="midi-qol-hits-display"><div class="end-midi-qol-hits-display">${damage_results}</div></div>`;
				content += replaceString
				await chatMessage.update({content});
				}
				}
			}
		}).render(true);
	}

	async function wait(ms) {
	    return new Promise(resolve => {
	        setTimeout(resolve, ms);
	    });
	}
}