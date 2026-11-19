# Request, 18 Nov 2026: campaign-specific item, equipment and loot generation

It came right after "can you generate campaing specific items too?" (2026-11-18-campaign-items.md). The user, verbatim:

> ATLAS — Campaign-Specific Item, Equipment & Loot Generation
> Claude, I want Atlas to have a comprehensive AI Item & Loot Generation System that creates items specifically suited to the campaign being played.
> First, inspect Atlas's existing item, inventory, equipment, NPC, location, economy, and loot systems.
> If any of these already exist, reuse and expand them. Do not create duplicate systems.
> 1. Campaign-Aware Item Generation
> Atlas should understand the campaign's:
>
> * Genre and historical period.
> * Technology level.
> * World lore and history.
> * Factions and civilizations.
> * Locations and environments.
> * Magic or supernatural systems.
> * Available resources and materials.
> * Campaign themes and atmosphere.
> * Game ruleset, where applicable.
>
> Generated items should fit naturally into that world.
> For example, a medieval fantasy campaign shouldn't randomly generate modern firearms unless the DM explicitly allows them.
> 2. Different Item Categories
> Support a broad range of items:
> Weapons and Armor
>
> * Swords, bows, shields, firearms, energy weapons.
> * Magical weapons and armor.
> * Unique faction equipment.
> * Improvised weapons.
>
> Consumables
>
> * Potions and elixirs.
> * Medicine.
> * Food and drink.
> * Ammunition.
> * Survival supplies.
>
> Everyday Items
>
> * Tools.
> * Clothing.
> * Jewelry.
> * Books.
> * Documents.
> * Keys.
> * Personal belongings.
>
> Valuables
>
> * Coins.
> * Gems.
> * Artwork.
> * Antiques.
> * Rare materials.
> * Trade goods.
>
> Unique and Story-Related Items
>
> * Ancient relics.
> * Cursed artifacts.
> * Scientific prototypes.
> * Alien technology.
> * Religious objects.
> * Family heirlooms.
> * Mysterious devices.
>
> Items should be appropriate to their setting and origin.
> 3. Campaign-Specific Loot
> Loot should reflect where it is discovered.
> For example:
> Fantasy — Bandit Camp
>
> * Stolen coins.
> * Worn weapons.
> * Food supplies.
> * A merchant's stolen necklace.
> * A letter mentioning a nearby hideout.
>
> 1920s Horror — Abandoned Manor
>
> * An antique revolver.
> * A damaged photograph.
> * An old diary.
> * A strange ceremonial object.
> * A locked jewelry box.
>
> Sci-Fi — Derelict Space Station
>
> * Damaged electronic components.
> * Emergency medical supplies.
> * Access cards.
> * Salvageable equipment.
> * An experimental device.
>
> The system should consider the location's history, inhabitants, resources, and recent events.
> Avoid completely unrelated loot unless there is a believable explanation.
> 4. Generate Items for NPCs
> Allow the DM to generate appropriate inventories for NPCs.
> Examples:
>
> * A merchant's shop inventory.
> * A soldier's equipment.
> * A noble's personal possessions.
> * A scientist's laboratory tools.
> * A cultist's ritual objects.
> * A bandit's stolen goods.
> * A space explorer's survival equipment.
>
> NPC inventories should reflect their profession, wealth, faction, and circumstances.
> Important NPCs may possess unique personal items connected to their backstories.
> 5. Item Rarity and Quality
> Support rarity and quality settings appropriate to the campaign's ruleset.
> For example:
>
> * Common.
> * Uncommon.
> * Rare.
> * Very rare.
> * Legendary.
>
> Also distinguish an item's rarity from its physical condition and quality.
> A common item could be exceptionally well-made, while a legendary artifact could be damaged.
> For realistic historical campaigns, rarity should not automatically imply magical properties.
> 6. Unique Item Descriptions and Histories
> Generated items should have meaningful descriptions.
> For important items, Atlas could generate:
>
> * Name.
> * Appearance.
> * Materials.
> * Condition.
> * Creator or manufacturer.
> * Approximate age.
> * Place of origin.
> * Previous owner.
> * Historical significance.
> * Special properties.
> * Estimated value.
> * Associated faction.
> * Relevant rumors.
>
> Not every ordinary object needs a long backstory.
> A rusty kitchen knife can simply be a rusty kitchen knife.
> Reserve detailed histories for items that deserve them.
> 7. Gameplay Rules and Item Statistics
> Where the campaign uses a specific ruleset, items should have compatible statistics.
> For example:
> D&D-style fantasy
>
> * Damage.
> * Armor class or protection.
> * Weight.
> * Magical effects.
> * Charges.
> * Attunement requirements.
>
> Call of Cthulhu-style investigation
>
> * Historical authenticity.
> * Relevant equipment statistics.
> * Investigative usefulness.
> * Sanity-related effects when appropriate.
>
> Sci-Fi
>
> * Power consumption.
> * Durability.
> * Ammunition or energy capacity.
> * Technical requirements.
> * Repairability.
>
> Do not invent official rules and present them as canonical.
> Distinguish official rules, homebrew mechanics, and narrative descriptions.
> Allow the DM to edit everything.
> 8. Loot Generation Controls
> Add a Generate Loot action to appropriate Atlas interfaces.
> For example:
>
> * NPC inventory.
> * Building or room editor.
> * Containers and chests.
> * Dungeon locations.
> * Shops.
> * Encounter results.
> * Campaign item library.
>
> Let the DM select:
>
> * Number of items.
> * Item category.
> * Approximate value.
> * Rarity.
> * Setting restrictions.
> * Mundane vs supernatural.
> * Location or NPC context.
>
> Provide a quick-generation option for use during live sessions.
> 9. Campaign-Specific Unique Artifacts
> I especially want Atlas to generate memorable unique items.
> For example:
> The Ashen King's Signet
> A tarnished silver ring bearing the crest of a kingdom destroyed centuries ago. Its inscription references a forgotten royal bloodline.
> This could become important to the campaign if the DM chooses.
> Or:
> Dr. Whitmore's Field Recorder
> A damaged recording device recovered from an abandoned research station. Its final recording contains unexplained sounds.
> Unique items should fit the existing story.
> If the campaign has an AI Writer Council, allow it to help design lore-consistent artifacts.
> 10. Item Images
> Allow Atlas to generate or assign visual representations of items.
> Support:
>
> * Simple item icons.
> * Inventory thumbnails.
> * Detailed item illustrations.
> * Genre-appropriate styles.
>
> For example, fantasy items might use illustrated parchment-style artwork, while Sci-Fi items might use technical inventory illustrations.
> Reuse existing asset libraries where possible.
> Do not require image generation for every mundane item.
> 11. Inventory and Ownership
> Items should be able to exist as actual objects in the campaign database.
> They should support:
>
> * Ownership.
> * Location.
> * Quantity.
> * Condition.
> * Value.
> * Weight, where relevant.
> * Equipment status.
> * Transfer between NPCs and characters.
> * Storage in containers.
> * Consumption or destruction.
>
> If Atlas already has an inventory system, integrate with it rather than creating another.
> An item found in a chest should be transferable to a player character without creating an unrelated duplicate.
> 12. Shops and Local Economies
> Generated shops should stock items appropriate to their location.
> For example:
>
> * A farming village sells agricultural tools and basic supplies.
> * A wealthy capital has luxury goods.
> * A mining settlement sells industrial equipment.
> * A remote frontier outpost has limited stock.
>
> Prices and availability should reflect the existing economy where that system is available.
> Avoid giving every merchant an identical generic inventory.
> 13. Secrets and Investigation Items
> For detective and horror campaigns, items may contain hidden information.
> Examples:
>
> * A diary with concealed entries.
> * A photograph containing a clue.
> * A key connected to a locked room.
> * A strange artifact with an unknown origin.
> * A document linked to an NPC.
>
> Integrate with Atlas's existing clue and evidence systems.
> Do not automatically create important story clues or change the mystery's solution without DM approval.
> The DM should be able to decide whether an item is ordinary loot, a clue, or an important plot object.
> 14. Dynamic Item Discovery
> Allow items to have information that becomes available later.
> For example:
> A player initially sees:
> "An old silver medallion with an unfamiliar symbol."
> After researching it, the DM may reveal:
> "The symbol belongs to an extinct religious order."
> Later, the players might learn its actual purpose.
> Keep hidden properties separate from player-visible descriptions.
> 15. Manual Item Creation
> The DM should also be able to create items entirely manually.
> Allow custom:
>
> * Names.
> * Descriptions.
> * Images.
> * Statistics.
> * Effects.
> * Prices.
> * Lore.
> * Ownership.
> * Discovery conditions.
>
> The AI should be optional.
> A manually created item should have the same capabilities as an AI-generated item.
> 16. Loot Tables and Reusability
> Allow the DM to create and save loot tables.
> Examples:
>
> * Medieval village household.
> * Bandit inventory.
> * Ancient tomb.
> * Abandoned hospital.
> * Space station storage room.
> * Alien research laboratory.
>
> Loot tables should support weighted probabilities, item categories, and campaign-specific restrictions.
> Allow generated items to be saved to the campaign's item library and reused elsewhere.
> 17. Avoid Excessive Loot
> The system should understand that not every location needs valuable items.
> An abandoned house might contain only broken furniture and ordinary household objects.
> A poor villager should not possess rare magical artifacts without a narrative reason.
> A mysterious location may contain no loot at all.
> Prioritize believable worldbuilding over constant rewards.
> 18. DM Copilot Integration
> During a session, I want to be able to ask the DM Copilot things like:
>
> * "Generate loot for this bandit."
> * "What would this merchant have for sale?"
> * "Create a unique artifact connected to this cult."
> * "What could players find in this abandoned laboratory?"
> * "Generate five ordinary objects for this room."
> * "Create a magical sword suitable for a level 5 party."
>
> The Copilot should use campaign context and existing world information.
> Present proposed items for approval before permanently adding them to the campaign.
> 19. Preserve Existing Atlas Systems
> Do not break or duplicate:
>
> * Existing inventory systems.
> * Equipment systems.
> * NPC generation.
> * Room generation.
> * Shop generation.
> * Economy simulation.
> * Clue systems.
> * Player visibility.
> * Campaign knowledge.
> * DM Copilot.
> * Writer Councils.
> * Saved campaigns.
>
> Inspect the existing architecture before implementing anything.
> Final Goal
> I want Atlas to generate items that feel like they genuinely belong to the campaign world.
> A fantasy blacksmith should have believable weapons and tools.
> A 1920s investigator should find period-appropriate documents and equipment.
> A Sci-Fi explorer should discover technology consistent with the civilization that created it.
> The system should support everything from ordinary household objects to legendary artifacts, with full DM editing and control.
> Most importantly, the loot should be influenced by the campaign's existing story, geography, factions, history, and rules rather than being randomly generated without context.
>
> everything should be rpg rule set / game specific like do not make something new as in if its dnd use dnd items if its mothership use mothership items, but let the player make their own too
