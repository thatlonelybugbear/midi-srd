export function bracersArchery(args) {
    const { item } = args[0] ?? {};
    if(["shortbow","longbow"].some(w=>[item.system.baseItem, item.name?.toLocaleLowerCase()].includes(w))) 
        return {damageRoll: "+2", flavor: "Bracers of Archery"}; 
}