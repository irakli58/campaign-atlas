/* The app's own lessons (the Help and tutorials of a campaign's page, atlas-tutorial.js, played on the app's start page:
   the server gives it at /tour.js). How a campaign is made: who does the work, the story, the choices, and where the
   campaigns are kept. The same shape as the skill's engine/atlas-tutorial-data.js; nothing typed here is sent. */
(function (A) {
  "use strict";
  const chapters = [
    { id: "make", title: "Making a campaign", lessons: [
      { id: "first", title: "Your first campaign", summary: "Paste a story, make a few choices, and Atlas makes the campaign: the story filled out, every place mapped.", features: ["app-new", "app-ai", "app-story", "app-choices", "app-council"], steps: [
        { say: "Campaign Atlas turns a story into a campaign you can play: the story filled out by a council of writers, every place mapped room by room, and the tools for game night.", sel: ".mast h1", act: "look" },
        { say: "Start here, with New campaign.", sel: "a[data-tab='new']", act: "click", try: "Click New campaign.", wait: 500 },
        { say: "First, who does the writing. With your own Claude subscription it costs nothing extra.", sel: "#newform .who", act: "look" },
        { say: "Give the campaign its name...", sel: "#newform [name='title']", act: "type", value: "The Lighthouse Keeper", try: "Type a name for your campaign." },
        { say: "...and paste your story: the plot, the people, the places, as much or as little as you have. The council fills out the rest.", sel: "#newform [name='story']", act: "look" },
        { say: "Then your choices. The world it is set in: fantasy, science fiction, or our world in any period. Or leave it to your story.", sel: "#newform input[name=genre]", act: "look" },
        { say: "The kind of campaign: a detective mystery, a living world to roam with no set path, or a world with mysteries in it.", sel: "#kinds", act: "look" },
        { say: "The council that writes it suits the world: mystery writers for a mystery, fantasy writers for fantasy, science fiction writers for science fiction. Open it to see them, swap a writer, add a specialist, or keep your own council.", sel: "#council summary", act: "look" },
        { say: "How freely the council may change your story, and how long the story they write should be.", sel: "#freedom", act: "look" },
        { say: "More choices, if you want them: the tone, how much horror or magic, how big a world, how many factions and events, and when it begins. Each is chosen to suit your story unless you set it.", sel: "#more summary", act: "look" },
        { say: "The world map, the game system, what must not change, your players' characters: all optional, and all kept as you say.", sel: "#newform [name='system']", act: "look" },
        { say: "Make my campaign starts the work. It runs on its own; you can watch it, or come back when it is done.", sel: "#gobtn", act: "look" },
        { say: "", sel: "#newform [name='title']", act: "type", value: "", auto: true },
        { say: "Your campaigns are kept here: open one to play it, carry on making it, or open its folder.", sel: "a[data-tab='campaigns']", act: "click", try: "Click Your campaigns." }
      ] }
    ] }
  ];
  const FEATURES = { "app-new": ["Making a campaign", "new story paste make"], "app-ai": ["Who does the writing", "claude codex api key subscription"], "app-story": ["Your story", "story paste title"], "app-choices": ["Your choices", "freedom length world map system genre fantasy science fiction sandbox detective hybrid"], "app-council": ["The council", "council writers judge guests specialists preset"] };
  A.tutorialData = { version: 1, chapters, FEATURES, ANCHORS: [["#newform .step h2", "app-new"]], welcome: ["first"] };
})(window.ATLAS || (window.ATLAS = {}));
