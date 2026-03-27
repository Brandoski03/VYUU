// VYUU v2.1 - Rubik Dirt onboarding
import { useState, useRef, useEffect } from "react";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://fppdkkophuprvqayykbo.supabase.co",
  "sb_publishable_1_d1prn5ZohKhNG-WsfohQ_aX05OK7r"
);

/* -----------------------------------------------------------------------------
   VYUU - ZINE BRUTALIST EDITION
   Aged paper . ink black . single red . typewriter + compressed grotesque
   Anti-corporate. Handmade. Real.
----------------------------------------------------------------------------- */

const T = {
  paper:   "#F2EFE9",
  ink:     "#0D0D0D",
  red:     "#1440E8",
  yellow:  "#FFE500",
  grey1:   "#D8D4CC",
  grey2:   "#A09890",
  grey3:   "#6A6260",
  wash:    "#E8E4DC",
  stamp:   "#1A1714",
  border:  "#0D0D0D",
};

/* One accent - red. Everything else is ink on paper. */
const CATS  = ["All","Tops","Bottoms","Outerwear","Dresses","Shoes","Accessories"];
const CONDS = ["Deadstock","Like New","Very Good","Good","Fair"];
const STYLE_TAGS = ["Streetwear","Vintage","Minimalist","Luxury","Techwear","Preppy","Y2K","Gorpcore","Workwear","Avant-garde"];
const DAILY_PROMPTS = [
  "What are you wearing today?",
  "Share your best thrift find this week.",
  "Post your go-to everyday fit.",
  "Show us your most-worn piece.",
  "What's the last thing you added to your wardrobe?",
  "Share an outfit that got you compliments.",
  "Post a fit built around one statement piece.",
  "What's your current favourite brand?",
];

/* --- DAILY THEMES --- */
/* --- THEME POOLS ------------------------------------------------------------
   COMMON themes rotate daily (7). NICHE themes surface ~once per 10-14 days
   via a date-seeded deterministic pick - consistent all day, never random on
   each render. The schedule: every 10th day from epoch uses a niche theme.
--------------------------------------------------------------------------- */
const COMMON_THEMES = [
  {
    id:"monochrome", name:"MONOCHROME MINIMAL", issue:"ISSUE 01", niche:false,
    directive:"One colour. Every piece. Zero distractions.",
    editorial:"Strip it back. Today is about restraint - pick a single tone and build your entire look around it. Black on black. Cream on cream. The quietest fits hit loudest.",
    prompt:"Post your monochrome fit today.", accent:"#0D0D0D",
    matchFn:(item)=>{ const t=(item.name+" "+(item.brand||"")+" "+(item.notes||"")).toLowerCase(); return t.includes("black")||t.includes("white")||t.includes("grey")||t.includes("cream")||t.includes("oxford")||item.cat==="Tops"||item.cat==="Bottoms"; },
    whyFn:(item)=>{ const t=(item.name+" "+(item.notes||"")).toLowerCase(); if(t.includes("white")||t.includes("oxford"))return "Clean base - anchors a tonal white palette."; if(t.includes("black"))return "The blackest piece you own. Lead with it."; if(item.cat==="Bottoms")return "Let the bottom half disappear."; return "Neutral building block for a tonal stack."; },
  },
  {
    id:"utilitycore", name:"UTILITY CORE", issue:"ISSUE 02", niche:false,
    directive:"Function first. Pockets required.",
    editorial:"Gorpcore, workwear, techwear - today every piece should earn its place. Think cargo, nylon, fleece, ripstop. Dress like you're about to do something important.",
    prompt:"Show us your most functional fit.", accent:"#3D5A3E",
    matchFn:(item)=>{ const t=(item.name+" "+(item.brand||"")+" "+(item.mat||"")+" "+(item.notes||"")).toLowerCase(); return t.includes("nylon")||t.includes("shell")||t.includes("down")||t.includes("puffer")||t.includes("foam")||item.cat==="Outerwear"||item.cat==="Shoes"; },
    whyFn:(item)=>{ const t=(item.name+" "+(item.mat||"")).toLowerCase(); if(t.includes("nylon")||t.includes("down")||t.includes("puffer"))return "Technical outerwear anchors a utility fit."; if(t.includes("foam")||item.cat==="Shoes")return "Trail-coded footwear finishes the silhouette."; return "Functional fabric - right for today."; },
  },
  {
    id:"archivehunt", name:"ARCHIVE HUNTING", issue:"ISSUE 03", niche:false,
    directive:"Dig deep. Wear the piece with the story.",
    editorial:"Today is for the collectors. Pull the thrift find. The hand-me-down. The piece that took months to track down. Wear what other people overlooked.",
    prompt:"Post the piece with the best backstory.", accent:"#7B4F2E",
    matchFn:(item)=>item.wears>10||item.lastWorn==="Today"||item.lastWorn==="2d ago",
    whyFn:(item)=>{ if(item.wears>20)return item.wears+" wears - this piece has earned its place."; if(item.wears>10)return "Well-worn. That patina is the whole point today."; return "Pull this one out. It's been sitting long enough."; },
  },
  {
    id:"layertheory", name:"LAYER THEORY", issue:"ISSUE 04", niche:false,
    directive:"Three pieces minimum. Proportions over everything.",
    editorial:"The fit lives in the silhouette. Base, mid, shell - each layer adds shape, not just warmth. The way pieces hang together is the whole conversation.",
    prompt:"Show your best layered stack today.", accent:"#1A3A5C",
    matchFn:(item)=>item.cat==="Tops"||item.cat==="Outerwear"||item.cat==="Accessories",
    whyFn:(item)=>{ if(item.cat==="Outerwear")return "Goes outermost - defines the silhouette."; if(item.cat==="Tops")return "Mid-layer or base - tuck, untuck, let the hem play."; return "Breaks the vertical. Makes it editorial."; },
  },
  {
    id:"softconstruct", name:"SOFT CONSTRUCTION", issue:"ISSUE 05", niche:false,
    directive:"Loose. Draped. Nothing too tight.",
    editorial:"Today is about volume and ease. Oversized silhouettes, unstructured shoulders, relaxed trousers. The best fits aren't trying - they're just falling correctly.",
    prompt:"What's your loosest, most effortless fit?", accent:"#5C4A7A",
    matchFn:(item)=>{ const t=(item.name+" "+(item.notes||"")+" "+(item.mat||"")).toLowerCase(); return t.includes("cotton")||t.includes("knit")||t.includes("linen")||item.cat==="Dresses"||item.cat==="Tops"; },
    whyFn:(item)=>{ if(item.cat==="Dresses")return "Let the cut move. Dresses are pure soft construction."; const t=(item.mat||"").toLowerCase(); if(t.includes("cotton")||t.includes("linen"))return "Natural fabric drapes - won't fight the silhouette."; return "Wear this a size up. Width is the point."; },
  },
  {
    id:"statement", name:"STATEMENT PIECE", issue:"ISSUE 06", niche:false,
    directive:"One loud piece. Everything else steps back.",
    editorial:"Pick the wildest thing in your wardrobe and build downward from it. One print, one silhouette, one piece that carries the whole look. Keep the rest quiet.",
    prompt:"Post the fit built around the loudest thing you own.", accent:"#B5001F",
    matchFn:(item)=>item.wears<5||item.cat==="Shoes"||item.cat==="Accessories"||item.cat==="Dresses",
    whyFn:(item)=>{ if(item.wears===0)return "Never worn? Today is that day."; if(item.wears<5)return "Rarely worn - still has full impact. Let it talk."; if(item.cat==="Shoes")return "Lead with the footwear. Build up from here."; return "Bring this front. Everything else steps back."; },
  },
  {
    id:"heritage", name:"HERITAGE CODES", issue:"ISSUE 07", niche:false,
    directive:"Workwear roots. Ivy lines. Timeless DNA.",
    editorial:"Not vintage - heritage. Pieces that reference a tradition. The Oxford shirt, the 501, the field jacket. Things built to last generations. You know the references.",
    prompt:"What's the most timeless piece in your wardrobe?", accent:"#2E2217",
    matchFn:(item)=>{ const t=(item.name+" "+(item.brand||"")+" "+(item.mat||"")).toLowerCase(); return t.includes("oxford")||t.includes("denim")||t.includes("cotton")||t.includes("levi")||t.includes("uniqlo")||t.includes("acne"); },
    whyFn:(item)=>{ const t=(item.name+" "+(item.brand||"")).toLowerCase(); if(t.includes("oxford")||t.includes("shirt"))return "The Oxford shirt is the cornerstone of heritage dressing."; if(t.includes("denim")||t.includes("jean"))return "The original workwear fabric. Raw or washed."; return "A piece that belongs to a lineage. Wear it like you know the reference."; },
  },
  {
    id:"thrifted", name:"THRIFTED ONLY", issue:"ISSUE 08", niche:false,
    directive:"Nothing new. Everything found.",
    editorial:"The charity shop rail. The car boot at 7am. The eBay deep dive at midnight. The best fits weren't bought — they were hunted. Today every single piece you wear has to have a story. Provenance over price tag. The hunt is the whole point.",
    prompt:"Post your best thrift find. Tell us where you got it.", accent:"#4A7C59",
    matchFn:(item)=>{ const t=(item.name+" "+(item.brand||"")+" "+(item.notes||"")).toLowerCase(); return t.includes("thrift")||t.includes("vintage")||t.includes("charity")||t.includes("second")||t.includes("found")||t.includes("ebay")||item.pricePaid<30||item.wears>8; },
    whyFn:(item)=>{ if(item.pricePaid&&item.pricePaid<30)return "Under $30. That's a find, not a purchase."; if(item.wears>10)return "Heavy rotation — the mark of a true thrift score."; const t=(item.notes||"").toLowerCase(); if(t.includes("thrift")||t.includes("charity"))return "You found this. That matters."; return "Pull it out. Today's for the hunters."; },
  },
];

const NICHE_THEMES = [
  {
    id:"deathcore_drip", name:"DEATHCORE DRIP", issue:"RARE DROP", niche:true,
    directive:"Dress like the venue smells like smoke and regret.",
    editorial:"Black cargo, distressed knit, chain detail, boots that have seen things. This isn't fashion - it's armour. For the people who got dressed at 2am and somehow nailed it.",
    prompt:"Post the darkest fit in your rotation.", accent:"#1A0A0A",
    matchFn:(item)=>{ const t=(item.name+" "+(item.brand||"")+" "+(item.notes||"")).toLowerCase(); return t.includes("black")||t.includes("cargo")||t.includes("boot")||item.cat==="Shoes"||item.cat==="Outerwear"; },
    whyFn:(item)=>{ if(item.cat==="Outerwear")return "Outermost layer. Make it feel like a shell."; if(item.cat==="Shoes")return "Boots carry this whole aesthetic. These are the right call."; return "Dark base. Builds the whole energy from here."; },
  },
  {
    id:"fridayoffice", name:"OFFICE NEVER", issue:"RARE DROP", niche:true,
    directive:"Corporate drag. Boardroom energy. Zero irony.",
    editorial:"Take the suit silhouette somewhere it wasn't designed to go. Tailored and unsettling. Dress codes are for people who don't know how to dress.",
    prompt:"Show us the fit that would get you pulled aside by HR.", accent:"#1C2B3A",
    matchFn:(item)=>item.cat==="Tops"||item.cat==="Bottoms"||item.cat==="Outerwear",
    whyFn:(item)=>{ if(item.cat==="Outerwear")return "The blazer or coat is the whole game today."; if(item.cat==="Bottoms")return "Trousers, not jeans. The cut is the message."; return "Tuck it. Then un-tuck one corner. This is the way."; },
  },
  {
    id:"wetpavement", name:"WET PAVEMENT", issue:"RARE DROP", niche:true,
    directive:"Grey sky. Grey fit. That's the brief.",
    editorial:"Not depression - London. The grey palette done with precision is one of the most underrated fits in existence. Stone, slate, ash, fog. Build it right.",
    prompt:"How grey can you go?", accent:"#4A4A4A",
    matchFn:(item)=>{ const t=(item.name+" "+(item.notes||"")).toLowerCase(); return t.includes("grey")||t.includes("gray")||t.includes("slate")||t.includes("stone")||item.cat==="Outerwear"; },
    whyFn:(item)=>{ if(item.cat==="Outerwear")return "Grey outerwear in rain weather is the whole look."; return "A grey piece is always the right call today."; },
  },
  {
    id:"dadonyacht", name:"DAD ON A YACHT", issue:"RARE DROP", niche:true,
    directive:"Nautical. But make it unaware.",
    editorial:"The original dad-core. Chinos, white sneakers, a tucked polo or a Breton stripe - worn by someone who absolutely does not know they look incredible.",
    prompt:"Post the most accidentally perfect prep fit.", accent:"#003366",
    matchFn:(item)=>{ const t=(item.name+" "+(item.brand||"")).toLowerCase(); return t.includes("white")||t.includes("stripe")||t.includes("polo")||t.includes("chino")||item.cat==="Shoes"||item.cat==="Tops"; },
    whyFn:(item)=>{ if(item.cat==="Shoes")return "White sneakers or loafers - only two acceptable choices today."; if(item.cat==="Tops")return "This goes tucked. Half-tucked at most. Full tuck preferred."; return "Classic base. The yacht owner aesthetic starts here."; },
  },
  {
    id:"academiadark", name:"DARK ACADEMIA", issue:"RARE DROP", niche:true,
    directive:"You're researching something dangerous in a library that's always autumn.",
    editorial:"Tweed, Oxford, brown leather, plaid. Worn with purpose. The books are real. The angst is real. The aesthetic is extremely considered.",
    prompt:"What would your character wear in the third act?", accent:"#3B2A1A",
    matchFn:(item)=>{ const t=(item.name+" "+(item.brand||"")+" "+(item.mat||"")).toLowerCase(); return t.includes("wool")||t.includes("leather")||t.includes("oxford")||t.includes("brown")||item.cat==="Accessories"; },
    whyFn:(item)=>{ if(item.cat==="Accessories")return "The scarf. The bag. The detail that tells the whole story."; const t=(item.mat||"").toLowerCase(); if(t.includes("wool"))return "Wool in dark academia is non-negotiable."; return "Muted, structured, intentional. Right for today."; },
  },
  {
    id:"menswearboy", name:"MENSWEAR BOY", issue:"RARE DROP", niche:true,
    directive:"The silhouette is everything. Tailoring as language.",
    editorial:"The Pitti Uomo guys have a point. A really well-proportioned suit worn with the right confidence is still one of the most radical things you can put on.",
    prompt:"Post the most tailored fit in your closet.", accent:"#0A0A1A",
    matchFn:(item)=>item.cat==="Tops"||item.cat==="Outerwear"||item.cat==="Shoes",
    whyFn:(item)=>{ if(item.cat==="Outerwear")return "The jacket or coat carries the entire silhouette today."; if(item.cat==="Shoes")return "Shoes are the first thing a menswear person looks at."; return "Clean lines. Pressed or deliberately not pressed. Either works."; },
  },
  {
    id:"internetcore", name:"INTERNET CORE", issue:"RARE DROP", niche:true,
    directive:"Born online. Worn in public.",
    editorial:"Something you found on a deep forum thread at 1am. A reference three people will get. A piece that's been through three different aesthetic phases and arrived somewhere genuinely interesting.",
    prompt:"Post the most niche piece in your wardrobe and explain the reference.", accent:"#004C4C",
    matchFn:(item)=>item.wears<8,
    whyFn:(item)=>{ if(item.wears===0)return "Never worn publicly. Perfect. Drop it today."; if(item.wears<3)return "Almost never worn - which makes it more interesting, not less."; return "The underplayed pieces always read the hardest online."; },
  },
  {
    id:"slowmorning", name:"SLOW MORNING FIT", issue:"RARE DROP", niche:true,
    directive:"Comfortable. But considered. The distinction matters.",
    editorial:"Lounge wear is not an excuse. Today is about the fit you wear when you have nowhere to be - done so well it looks intentional. Because it is.",
    prompt:"Post the fit you wear when no one's watching (but you dressed for it anyway).", accent:"#7A6A5A",
    matchFn:(item)=>{ const t=(item.mat||"").toLowerCase(); return t.includes("cotton")||t.includes("knit")||t.includes("fleece")||item.cat==="Tops"||item.cat==="Bottoms"; },
    whyFn:(item)=>{ const t=(item.mat||"").toLowerCase(); if(t.includes("fleece")||t.includes("knit"))return "Soft fabric, strong presence. That's the whole brief."; return "The everyday piece - elevated by being chosen deliberately."; },
  },
  {
    id:"silentluxury", name:"SILENT LUXURY", issue:"RARE DROP", niche:true,
    directive:"No logos. No noise. Just quality.",
    editorial:"The old money aesthetic isn't about money - it's about restraint. Cashmere that looks like nothing. Trousers that cost more than your rent. The whole point is that no one knows.",
    prompt:"Post the most expensive-looking boring fit you own.", accent:"#C8B89A",
    matchFn:(item)=>{ const t=(item.brand||"").toLowerCase(); return t.includes("lemaire")||t.includes("acne")||t.includes("uniqlo")||t.includes("our legacy")||item.cat==="Bottoms"||item.cat==="Tops"; },
    whyFn:(item)=>{ const t=(item.brand||"").toLowerCase(); if(t.includes("lemaire")||t.includes("acne"))return "This is the piece that does all the talking without saying anything."; return "Neutral, precise, unbothered. The silent luxury brief exactly."; },
  },
  {
    id:"racerback", name:"MOTORSPORT DNA", issue:"RARE DROP", niche:true,
    directive:"Pit lane energy. Sponsor patches optional.",
    editorial:"Formula 1 gave fashion one of its best moments - and it hasn't let go. Racing stripes, technical fabrics, colour-blocked shells. Fast cuts. Speed-coded silhouettes.",
    prompt:"Show us the racing-coded fit.", accent:"#CC2200",
    matchFn:(item)=>{ const t=(item.name+" "+(item.brand||"")+" "+(item.mat||"")).toLowerCase(); return t.includes("nylon")||t.includes("stripe")||t.includes("jacket")||item.cat==="Outerwear"||item.cat==="Shoes"; },
    whyFn:(item)=>{ if(item.cat==="Outerwear")return "The racing jacket energy starts here. Shell or bomber."; if(item.cat==="Shoes")return "Low-profile or technical - both work for this aesthetic."; return "Colour-block it. Racing is always about contrast."; },
  },
  {
    id:"y2k_redux", name:"Y2K REDUX", issue:"RARE DROP", niche:true,
    directive:"2003 but you actually understand why now.",
    editorial:"Not the cringe part - the interesting part. Low-rise done with intention. Baby tee with the right proportions. The nostalgia with the current vocabulary. The edit matters.",
    prompt:"Post the Y2K piece you've always wanted to wear.", accent:"#CC88BB",
    matchFn:(item)=>{ const t=(item.name+" "+(item.notes||"")).toLowerCase(); return t.includes("low")||t.includes("baby")||t.includes("crop")||item.cat==="Dresses"||item.cat==="Tops"; },
    whyFn:(item)=>{ if(item.cat==="Dresses")return "The mini dress is the centrepiece of this whole era."; if(item.cat==="Tops")return "Baby tee, cami, halter - the Y2K top is the whole conversation."; return "Low, small, or sheer. At least one of those."; },
  },
  {
    id:"postapoc", name:"POST-APOCALYPTIC PREP", issue:"RARE DROP", niche:true,
    directive:"The world ended. You're still dressed.",
    editorial:"Distressed, layered, functional but broken. Asymmetric hems. Boots that have walked somewhere. Multiple textures that shouldn't work. They do.",
    prompt:"What are you wearing when the grid goes down?", accent:"#3A2E20",
    matchFn:(item)=>item.cat==="Outerwear"||item.cat==="Shoes"||item.cat==="Accessories",
    whyFn:(item)=>{ if(item.cat==="Outerwear")return "This is the shell you're wearing when everything else fails."; if(item.cat==="Shoes")return "Boots first. Always boots in the apocalypse."; return "The detail that signals you thought about this before it was too late."; },
  },
  {
    id:"thriftgod", name:"THRIFT GOD CHALLENGE", issue:"RARE DROP", niche:true,
    directive:"Everything you're wearing cost under $40 total.",
    editorial:"The most respected fit is the one that wasn't bought - it was hunted. The charity shop rail, the car boot find, the eBay deep dive at midnight. Provenance over price tag.",
    prompt:"Post the fit. Tell us what it cost. Be honest.", accent:"#4A5A2A",
    matchFn:(item)=>item.wears>5||item.lastWorn==="Today",
    whyFn:(item)=>{ if(item.wears>15)return "This piece has earned its story. Wear it with full confidence."; return "The more times you've worn it, the more authentically yours it is."; },
  },
  {
    id:"invisible_fit", name:"THE INVISIBLE FIT", issue:"RARE DROP", niche:true,
    directive:"Dress like you aren't trying to be seen. And somehow be unforgettable.",
    editorial:"The hardest aesthetic to execute. No statement piece, no visible logos, nothing 'interesting' - just proportion, texture, and silhouette so perfectly calibrated it stops people.",
    prompt:"Post the quietest fit that hits the hardest.", accent:"#5A5A5A",
    matchFn:(item)=>item.cat==="Tops"||item.cat==="Bottoms",
    whyFn:(item)=>{ if(item.cat==="Tops")return "Plain top. The fit is in how it sits, not what's on it."; if(item.cat==="Bottoms")return "The trouser or jean that makes the proportion. This is that piece."; return "Background piece. Foreground fit."; },
  },
];

/* Pool with weights: common themes appear 10x more than niche ones.
   Pick is seeded by day-of-year so it's stable across the whole day. */
const DAILY_THEMES = (() => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,1)) / 86400000);
  // Every 10th day from start of year: niche theme
  if (dayOfYear % 10 === 0) {
    const nicheIdx = Math.floor(dayOfYear / 10) % NICHE_THEMES.length;
    return [...COMMON_THEMES, NICHE_THEMES[nicheIdx]];
  }
  return COMMON_THEMES;
})();

const USERS = {
  me:    { id:"me",    name:"Jordan Lee",   handle:"jordanlee",  followers:412,  following:98,  bio:"Streetwear collector. Chicago.",  styles:["Streetwear","Minimalist"] },
  alex:  { id:"alex",  name:"Alex Reeves",  handle:"alexreeves", followers:8420, following:310, bio:"Vintage & contemporary. NYC.",     styles:["Vintage","Streetwear"], isShop:false },
  maya:  { id:"maya",  name:"Maya Osei",    handle:"mayaosei",   followers:3210, following:201, bio:"Thrift-first fashion. London.",    styles:["Vintage","Y2K"] },
  juno:  { id:"juno",  name:"Juno Park",    handle:"junopark",   followers:5890, following:440, bio:"AW25. Stone Island. Lemaire.",     styles:["Luxury","Minimalist"], isShop:false },
  river: { id:"river", name:"River Santos", handle:"riversantos",followers:2140, following:178, bio:"Sneaker collector. Los Angeles.",  styles:["Streetwear","Techwear"] },
};

const INIT_POSTS = [
  { id:"p1", user:"alex",  votes:142, votedBy:[], cat:"Tops",       caption:"Vintage Levi's trucker layered over a cream turtleneck. This stack has been in heavy rotation.", likes:342,  likedBy:["maya"],       comments:[{u:"maya",t:"This is clean."},{u:"juno",t:"The layering here is perfect."}], time:"2h",  tags:["vintage","layering","levis"],   img:null },
  { id:"p2", user:"maya",  votes:389, votedBy:["me"], cat:"Dresses",    caption:"Found this MM6 piece at a local charity shop for next to nothing. Condition is immaculate.",      likes:891,  likedBy:["alex","juno"], comments:[{u:"juno",t:"No way. What a find."},{u:"river",t:"You always win."}],        time:"5h",  tags:["thrift","margiela","mm6"],      img:null },
  { id:"p3", user:"juno",  votes:891, votedBy:[], cat:"Outerwear",  caption:"AW25 layering test. Stone Island shell over the Lemaire knit. The proportions are working.",      likes:2310, likedBy:["me","alex"],   comments:[{u:"alex",t:"The fit is dialled in."},{u:"river",t:"Stone Island never misses."}], time:"8h", tags:["stoneisland","lemaire","aw25"], img:null },
  { id:"p4", user:"river", votes:203, votedBy:[], cat:"Shoes",      caption:"New Balance 1906R in the beige colourway. On daily rotation for three weeks.",                     likes:567,  likedBy:[],             comments:[{u:"alex",t:"Best colourway in the lineup."}],                               time:"12h", tags:["newbalance","1906r","sneakers"],img:null },
  { id:"p5", user:"alex",  votes:567, votedBy:[], cat:"Accessories",caption:"Acne Studios wool scarf. One piece that makes every outfit. Worth every penny.",                   likes:1203, likedBy:["maya"],       comments:[{u:"maya",t:"Acne accessories are unmatched."}],                            time:"1d",  tags:["acne","accessories","scarf"],   img:null },
];

const INIT_LISTINGS = [
  { id:"l1", user:"alex",  priceHistory:[{date:"Jan",price:120},{date:"Feb",price:105},{date:"Mar",price:92},{date:"Now",price:85}], title:"Levi's 501 '93 Straight",       brand:"Levi's",       price:85,  retail:148,  size:"W32 L30", cat:"Bottoms",   cond:"Good",      auction:true,  ends:"2d 4h",  bids:[{u:"maya",a:80},{u:"river",a:75}], offers:[],                              desc:"Classic 501 cut. Light wash, natural fading at the knees. No rips.", verified:true  },
  { id:"l2", user:"maya",  priceHistory:[{date:"Oct",price:280},{date:"Dec",price:250},{date:"Feb",price:225},{date:"Now",price:210}], title:"Acne Studios Crew Knit",         brand:"Acne Studios", price:210, retail:420,  size:"M",       cat:"Tops",      cond:"Like New",  auction:false, ends:null,     bids:[],                                offers:[{u:"juno",a:190,s:"pending"}], desc:"FN-MN-KNIT crew. Worn twice. Original dust bag included.",           ok:true  },
  { id:"l3", user:"juno",  priceHistory:[{date:"Nov",price:280},{date:"Jan",price:310},{date:"Feb",price:330},{date:"Now",price:340}], title:"New Balance 1906R",              brand:"New Balance",  price:340, retail:150,  size:"US 10",   cat:"Shoes",     cond:"Deadstock", auction:true,  ends:"6h 22m", bids:[{u:"me",a:335},{u:"river",a:320}], offers:[],                              desc:"Deadstock. Original box, tissue paper, spare laces.",                ok:true  },
  { id:"l4", user:"river", title:"Stone Island AW22 Shell Jacket", brand:"Stone Island", price:580, retail:895,  size:"L",       cat:"Outerwear", cond:"Good",      auction:false, ends:null,     bids:[],                                offers:[{u:"me",a:550,s:"pending"}],   desc:"Ghost piece AW22. Compass badge intact.",                            ok:false },
  { id:"l5", user:"alex",  title:"Maison Margiela Tabi Boot",      brand:"MM6",          price:680, retail:1200, size:"EU 42",   cat:"Shoes",     cond:"Very Good", auction:true,  ends:"1d 2h",  bids:[{u:"maya",a:670}],                offers:[],                              desc:"Black leather Tabi. Light creasing on toe box only.",                ok:true  },
  { id:"l6", user:"juno",  title:"Lemaire Twisted Cardigan",       brand:"Lemaire",      price:290, retail:560,  size:"S",       cat:"Tops",      cond:"Like New",  auction:false, ends:null,     bids:[],                                offers:[],                              desc:"F22. Extremely rare twisted-seam. Worn once.",                       ok:true  },
];

const INIT_WARDROBE = [
  { id:"w1", name:"White Oxford Shirt", cat:"Tops",      brand:"Uniqlo",     size:"M",   mat:"100% Cotton",      chest:"40",waist:"",  hips:"",  len:"28",inseam:"", notes:"Everyday staple", wears:12, lastWorn:"2d ago", img:null, pricePaid:29,  dateAdded:"2023-06-10", priceHistory:[] },
  { id:"w2", name:"Black Slim Jeans",   cat:"Bottoms",   brand:"Acne",       size:"W30", mat:"98% Cotton Denim", chest:"",  waist:"30",hips:"38",len:"",  inseam:"31",notes:"",               wears:28, lastWorn:"Today",   img:null, pricePaid:180, dateAdded:"2022-11-03", priceHistory:[] },
  { id:"w3", name:"Grey Down Puffer",   cat:"Outerwear", brand:"Arc'teryx",  size:"L",   mat:"Nylon/Down",       chest:"46",waist:"",  hips:"",  len:"30",inseam:"", notes:"Waterproof",     wears:8,  lastWorn:"1w ago",  img:null, pricePaid:650, dateAdded:"2023-01-22", priceHistory:[] },
  { id:"w4", name:"NB Foam Runner",     cat:"Shoes",     brand:"New Balance",size:"US10",mat:"Foam/Mesh",        chest:"",  waist:"",  hips:"",  len:"",  inseam:"", notes:"Clean pair",     wears:45, lastWorn:"Today",   img:null, pricePaid:110, dateAdded:"2022-08-15", priceHistory:[] },
];

const INIT_DMS = {
  alex:  [{from:"alex",text:"Hey! Still have that Oxford shirt?",       time:"1h"},{from:"me",text:"Yeah it's still available!",time:"45m"}],
  maya:  [{from:"maya",text:"Love your latest fit",                      time:"3h"}],
  juno:  [{from:"juno",text:"Would you take $520 for the shell jacket?", time:"5h"}],
  river: [],
};

const INIT_NOTIFS = [
  {id:"n1",type:"like",   user:"alex", text:"liked your post",         time:"2m",  read:false},
  {id:"n2",type:"comment",user:"maya", text:'commented: "Clean fit"',  time:"15m", read:false},
  {id:"n3",type:"bid",    user:"river",text:"placed a bid of $320",    time:"1h",  read:false},
  {id:"n4",type:"follow", user:"juno", text:"started following you",   time:"2h",  read:true },
  {id:"n5",type:"offer",  user:"maya", text:"sent an offer of $190",   time:"3h",  read:true },
  {id:"n6",type:"like",   user:"river",text:"liked your post",         time:"4h",  read:true },
];

/* --- GRAIN TEXTURE OVERLAY --- */
function Grain() {
  return (
    <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:999,opacity:.045,mixBlendMode:"multiply"}} xmlns="http://www.w3.org/2000/svg">
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
      <rect width="100%" height="100%" filter="url(#grain)"/>
    </svg>
  );
}

/* --- CLOTHING SILHOUETTES - ink drawn --- */
function ClothingShape({ category, size=80 }) {
  const s = { fill:"none", stroke:T.ink, strokeWidth:"1.5", strokeLinecap:"round", strokeLinejoin:"round" };
  if(category==="Tops"||category==="Outerwear")
    return <svg width={size} height={size} viewBox="0 0 80 80"><path {...s} d="M20 10L8 26L20 30L20 68L60 68L60 30L72 26L60 10L50 18Q40 24 30 18Z"/><line {...s} x1="30" y1="18" x2="30" y2="30"/><line {...s} x1="50" y1="18" x2="50" y2="30"/></svg>;
  if(category==="Bottoms")
    return <svg width={size} height={size} viewBox="0 0 80 80"><path {...s} d="M15 12L18 70L36 70L40 40L44 70L62 70L65 12Z"/><line {...s} x1="15" y1="18" x2="65" y2="18"/></svg>;
  if(category==="Dresses")
    return <svg width={size} height={size} viewBox="0 0 80 80"><path {...s} d="M28 8Q40 4 52 8L58 26L50 28L56 72L24 72L30 28L22 26Z"/></svg>;
  if(category==="Shoes")
    return <svg width={size} height={size} viewBox="0 0 80 80"><path {...s} d="M8 52Q8 38 22 34L38 32Q54 30 66 36L70 44Q72 52 66 54L14 58Q8 58 8 52Z"/><path {...s} d="M22 34L24 24Q26 18 32 18L40 18Q46 18 46 26L46 32"/></svg>;
  return <svg width={size} height={size} viewBox="0 0 80 80"><rect {...s} x="18" y="30" width="44" height="36" rx="0"/><path {...s} d="M28 30Q28 16 40 16Q52 16 52 30"/></svg>;
}

/* --- ITEM PHOTO PLACEHOLDER - zine cut-out --- */
function ItemPhoto({ img=null, category="Tops", brand="", height=300, small=false }) {
  if(img) return (
    <div style={{height,overflow:"hidden",flexShrink:0,borderBottom:`2px solid ${T.ink}`}}>
      <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block",filter:"contrast(1.05)"}}/>
    </div>
  );
  /* ruled notebook lines pattern */
  const lines = Array.from({length:Math.ceil(height/20)}, (_,i) => i);
  return (
    <div style={{height,background:T.paper,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",flexShrink:0,borderBottom:`2px solid ${T.ink}`}}>
      {/* ruled lines */}
      <div style={{position:"absolute",inset:0}}>
        {lines.map(i=><div key={i} style={{position:"absolute",top:i*20+32,left:0,right:0,height:1,background:`${T.grey1}88`}}/>)}
        {/* red margin line */}
        <div style={{position:"absolute",top:0,bottom:0,left:28,width:1,background:`${T.red}44`}}/>
      </div>
      {/* centered silhouette */}
      <div style={{position:"relative",zIndex:2,opacity:.55}}>
        <ClothingShape category={category} size={small?46:68}/>
      </div>
      {/* category stamp - top right */}
      <div style={{position:"absolute",top:8,right:8,fontFamily:"'Courier Prime',monospace",fontWeight:700,fontSize:8,color:T.paper,background:T.ink,padding:"2px 7px",letterSpacing:"0.2em",textTransform:"uppercase",zIndex:3}}>
        {category.toUpperCase()}
      </div>
      {brand&&<div style={{position:"absolute",bottom:8,left:0,right:0,textAlign:"center",fontSize:8,color:T.grey3,letterSpacing:"0.18em",textTransform:"uppercase",fontFamily:"'Courier Prime',monospace",zIndex:3}}>{brand}</div>}
    </div>
  );
}

/* --- IMAGE UPLOAD --- */
function ImageUpload({ value, onChange, height=160, label="ATTACH PHOTO" }) {
  const ref=useRef();
  const [drag,setDrag]=useState(false);
  const handle=f=>{if(!f)return;const r=new FileReader();r.onload=e=>onChange(e.target.result);r.readAsDataURL(f);};
  return (
    <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files[0]);}} onClick={()=>ref.current.click()}
      style={{height,border:`2px dashed ${drag?T.red:T.grey2}`,background:drag?`${T.red}08`:T.wash,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,position:"relative",overflow:"hidden",transition:"border-color .15s"}}>
      {value
        ?<img src={value} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        :<>
          <div style={{fontFamily:"'Courier Prime',monospace",fontWeight:700,fontSize:10,color:T.grey3,letterSpacing:"0.2em"}}>{label}</div>
          <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey2}}>drag or click</div>
        </>
      }
      {value&&<button style={{position:"absolute",top:6,right:6,background:T.ink,border:"none",color:T.paper,width:22,height:22,cursor:"pointer",fontSize:11,fontFamily:"'Courier Prime',monospace",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{e.stopPropagation();onChange(null);}}>{"×"}</button>}
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handle(e.target.files[0])}/>
    </div>
  );
}

/* --- USER AVATAR - rubber stamp circle --- */
function UserAvatar({ name="?", size=36, highlight=false }) {
  const initials=name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,border:`${highlight?2:1.5}px solid ${highlight?T.red:T.ink}`,background:highlight?T.red:T.paper,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
      <span style={{fontSize:size*0.34,fontWeight:700,color:highlight?T.paper:T.ink,fontFamily:"'Archivo Black',sans-serif",lineHeight:1}}>{initials}</span>
    </div>
  );
}

/* --- LOGO - stencil stamp --- */
function Logo({ size=28 }) {
  return (
    <div style={{display:"flex",alignItems:"baseline",gap:0,userSelect:"none",lineHeight:1}}>
      <span style={{fontFamily:"'Rubik Dirt','Arial Black',sans-serif",fontWeight:400,fontSize:size,color:T.yellow,letterSpacing:"-1px"}}>VY</span>
      <span style={{fontFamily:"'Rubik Dirt','Arial Black',sans-serif",fontWeight:400,fontSize:size,color:T.red,letterSpacing:"-1px"}}>UU</span>
    </div>
  );
}

/* --- CONDITION BADGE --- */
function CondBadge({ cond }) {
  const map={"Deadstock":{bg:T.yellow,fg:T.ink},"Like New":{bg:T.paper,fg:T.ink},"Very Good":{bg:T.paper,fg:T.ink},"Good":{bg:T.paper,fg:T.grey3},"Fair":{bg:T.paper,fg:T.grey2}};
  const s=map[cond]||{bg:T.paper,fg:T.ink};
  const isDeadstock=cond==="Deadstock";
  return <span style={{fontSize:8,color:s.fg,border:`1px solid ${isDeadstock?T.ink:T.grey2}`,padding:"2px 7px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Courier Prime',monospace",fontWeight:700,whiteSpace:"nowrap",background:s.bg}}>{cond}</span>;
}

/* --- STAMP / TAG ELEMENTS --- */
function RedStamp({ children, style={} }) {
  return <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:9,color:T.paper,background:T.red,padding:"2px 8px",letterSpacing:"0.1em",textTransform:"uppercase",...style}}>{children}</span>;
}

function InkTag({ children }) {
  return <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,border:`1px solid ${T.grey2}`,padding:"1px 6px",letterSpacing:"0.1em"}}>{children}</span>;
}

/* --- BLADE TRANSITION --- */
function Blade({ active, children }) {
  const [show,setShow]=useState(false);
  useEffect(()=>{if(active){setShow(false);requestAnimationFrame(()=>requestAnimationFrame(()=>setShow(true)));}}, [active]);
  if(!active) return null;
  return <div style={{animation:show?"fadeUp .28s cubic-bezier(.2,.8,.4,1) both":"none",display:show?undefined:"none"}}>{children}</div>;
}

/* --- BUTTON - cut-paper style --- */
/* --- TACTILE BUTTON SYSTEM ------------------------------------------------
   Physical weight: resting shadow lifts button off the page. Press drops it
   flush. Release bounces back with a spring. Hover shifts the shadow color
   to signal it's alive. Texture via SVG noise filter baked into the surface.
--------------------------------------------------------------------------- */
const BTN_NOISE_ID = "btnGrain";

function Btn({ children, onClick, variant="primary", style={}, disabled=false, col=null }) {
  const [press, setPress] = useState(false);
  const [hover, setHover] = useState(false);

  // Shadow depth: 4px resting -> 0px pressed (drops flush to page)
  // Translate: 0 resting -> 4px pressed (sinks into surface)
  const depth = press ? 0 : hover ? 5 : 4;
  const tx = press ? 4 : hover ? -1 : 0;
  const ty = press ? 4 : hover ? -1 : 0;

  const base = {
    fontFamily: "'Archivo Black',sans-serif",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    border: `2px solid ${T.ink}`,
    cursor: disabled ? "not-allowed" : "pointer",
    outline: "none",
    position: "relative",
    transform: `translate(${tx}px,${ty}px)`,
    transition: press
      ? "transform .06s cubic-bezier(.3,0,.6,1), box-shadow .06s cubic-bezier(.3,0,.6,1)"
      : "transform .18s cubic-bezier(.2,.8,.4,1.2), box-shadow .18s cubic-bezier(.2,.8,.4,1.2)",
    opacity: disabled ? .35 : 1,
    padding: "9px 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    userSelect: "none",
  };

  const shadowColor = {
    primary: T.red,
    red:     T.ink,
    ghost:   T.grey2,
    outline: col ? col+"66" : T.grey2,
  };

  const variants = {
    primary: {
      background: T.ink,
      color: T.paper,
      boxShadow: `${depth}px ${depth}px 0 ${shadowColor.primary}`,
    },
    red: {
      background: T.red,
      color: T.paper,
      border: `2px solid ${T.red}`,
      boxShadow: `${depth}px ${depth}px 0 ${shadowColor.red}`,
    },
    ghost: {
      background: hover ? T.wash : "transparent",
      color: T.ink,
      boxShadow: depth > 0 ? `${depth}px ${depth}px 0 ${shadowColor.ghost}` : "none",
    },
    outline: {
      background: T.paper,
      color: col || T.ink,
      border: `2px solid ${col || T.ink}`,
      boxShadow: depth > 0 ? `${depth}px ${depth}px 0 ${col ? col+"66" : T.grey2}` : "none",
    },
  };

  const v = variants[variant] || variants.primary;

  return (
    <button
      disabled={disabled}
      onMouseDown={() => { if (!disabled) setPress(true); }}
      onMouseUp={() => setPress(false)}
      onMouseLeave={() => { setPress(false); setHover(false); }}
      onMouseEnter={() => { if (!disabled) setHover(true); }}
      onTouchStart={() => { if (!disabled) setPress(true); }}
      onTouchEnd={() => setPress(false)}
      onClick={onClick}
      style={{ ...base, ...v, ...style }}
    >
      {children}
    </button>
  );
}

/* --- SHARE MODAL --- */
function ShareModal({ item, type="post", onClose }) {
  const [copied,setCopied]=useState(false);
  const url=`https://vyuu.app/${type}/${item.id}`;
  const copy=()=>{navigator.clipboard?.writeText(url).catch(()=>{});setCopied(true);setTimeout(()=>setCopied(false),1800);};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(13,13,13,.6)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.paper,borderTop:`3px solid ${T.ink}`,width:"min(480px,100%)",padding:"24px 20px 36px",animation:"slideUp .25s ease",boxShadow:`0 -4px 0 ${T.ink}`}} onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:14,color:T.ink,letterSpacing:"0.06em",marginBottom:20}}>SHARE THIS {type.toUpperCase()}</div>
        {navigator.share&&<button onClick={()=>{navigator.share({title:"VYUU fit",url}).catch(()=>{});}} style={{width:"100%",background:T.ink,border:"none",color:T.paper,padding:"12px",fontFamily:"'Archivo Black',sans-serif",fontSize:10,letterSpacing:"0.1em",cursor:"pointer",marginBottom:12}}>SHARE {"↑"}</button>}
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {[["Instagram","https://instagram.com"],["TikTok","https://tiktok.com"],["Twitter","https://twitter.com/intent/tweet?url="],["WhatsApp","https://wa.me/?text="]].map(([p,base])=>(
            <a key={p} href={p==="Twitter"||p==="WhatsApp"?base+encodeURIComponent(url):"#"} target="_blank" rel="noopener" style={{border:"2px solid "+T.ink,padding:"8px 14px",cursor:"pointer",fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.ink,letterSpacing:"0.08em",textTransform:"uppercase",textDecoration:"none"}}>{p}</a>
          ))}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",background:T.wash,border:`2px solid ${T.grey1}`,padding:"10px 12px"}}>
          <span style={{flex:1,fontSize:10,color:T.grey3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Courier Prime',monospace"}}>{url}</span>
          <Btn style={{padding:"6px 12px",fontSize:9}} onClick={copy}>{copied?"COPIED":"COPY"}</Btn>
        </div>
      </div>
    </div>
  );
}

/* --- NOTIFICATIONS --- */
function NotifPanel({ notifs, onClose, onMarkAll }) {
  const icons={like:"♥",comment:"//",bid:"▲",follow:"→",offer:"◈",pricedrop:"v",offer_accepted:"✓",counter:"↔"};
  return (
    <div style={{position:"fixed",inset:0,zIndex:200}} onClick={onClose}>
      <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",background:T.paper,borderTop:`3px solid ${T.ink}`,border:`2px solid ${T.ink}`,borderBottom:"none",width:"min(480px,100%)",maxHeight:"72vh",display:"flex",flexDirection:"column",animation:"slideUp .25s ease",boxShadow:`0 -4px 0 0 ${T.ink}`}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:`2px solid ${T.ink}`}}>
          <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:13,color:T.ink,letterSpacing:"0.06em"}}>NOTIFICATIONS</div>
          <div style={{display:"flex",gap:12}}>
            <button onClick={onMarkAll} style={{background:"none",border:"none",color:T.grey3,fontSize:10,cursor:"pointer",fontFamily:"'Courier Prime',monospace",letterSpacing:"0.08em",textTransform:"uppercase",textDecoration:"underline"}}>mark read</button>
            <button onClick={onClose} style={{background:"none",border:"none",color:T.ink,cursor:"pointer",fontSize:16,fontFamily:"'Archivo Black',sans-serif"}}>{"×"}</button>
          </div>
        </div>
        <div style={{overflowY:"auto"}}>
          {notifs.map(n=>(
            <div key={n.id} style={{display:"flex",gap:10,alignItems:"center",padding:"12px 16px",borderBottom:`1px solid ${T.grey1}`,background:n.read?T.paper:T.wash}}>
              {!n.read&&<div style={{width:4,height:4,background:T.red,flexShrink:0}}/>}
              {n.read&&<div style={{width:4,flexShrink:0}}/>}
              <UserAvatar name={USERS[n.user]?.name||"?"} size={30}/>
              <div style={{flex:1}}>
                <span style={{fontSize:11,color:T.ink,fontFamily:"'Courier Prime',monospace",fontWeight:700}}>@{USERS[n.user]?.handle} </span>
                <span style={{fontSize:11,color:T.grey3,fontFamily:"'Courier Prime',monospace"}}>{n.text}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
                <span style={{fontSize:12,color:n.read?T.grey2:T.red,fontFamily:"'Courier Prime',monospace"}}>{icons[n.type]||"."}</span>
                <span style={{fontSize:9,color:T.grey2,fontFamily:"'Courier Prime',monospace"}}>{n.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- DM PANEL --- */
function DMPanel({ dms, setDms, onClose }) {
  const [active,setActive]=useState(null);
  const [msg,setMsg]=useState("");
  const endRef=useRef();
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[active,dms]);
  const send=()=>{if(!msg.trim()||!active)return;setDms(d=>({...d,[active]:[...(d[active]||[]),{from:"me",text:msg.trim(),time:"now"}]}));setMsg("");};
  const INP={background:T.wash,border:`2px solid ${T.grey2}`,borderLeft:`2px solid ${T.ink}`,color:T.ink,padding:"9px 12px",fontSize:12,fontFamily:"'Courier Prime',monospace",outline:"none",flex:1,boxSizing:"border-box"};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(13,13,13,.6)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:T.paper,border:`3px solid ${T.ink}`,boxShadow:`6px 6px 0 ${T.ink}`,width:"min(480px,100%)",height:"min(600px,90vh)",display:"flex",flexDirection:"column",animation:"bladeIn .22s ease",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"13px 16px",borderBottom:`2px solid ${T.ink}`,background:T.ink}}>
          {active&&<button onClick={()=>setActive(null)} style={{background:"none",border:"none",color:T.paper,cursor:"pointer",fontSize:16,fontFamily:"'Archivo Black',sans-serif",lineHeight:1}}>{"←"}</button>}
          <span style={{flex:1,fontFamily:"'Archivo Black',sans-serif",fontSize:13,color:T.paper,letterSpacing:"0.06em"}}>{active?`@${USERS[active]?.handle}`:"MESSAGES"}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.paper,cursor:"pointer",fontSize:16}}>{"×"}</button>
        </div>
        {!active
          ?<div style={{flex:1,overflowY:"auto"}}>
            {Object.keys(USERS).filter(u=>u!=="me").map(uid=>{
              const u=USERS[uid]; const thread=dms[uid]||[]; const last=thread[thread.length-1];
              const unread=last?.from!=="me"&&thread.length>0;
              return (
                <div key={uid} onClick={()=>setActive(uid)} style={{display:"flex",gap:12,alignItems:"center",padding:"13px 16px",borderBottom:`1px solid ${T.grey1}`,cursor:"pointer",background:unread?T.wash:T.paper,transition:"background .1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.wash} onMouseLeave={e=>e.currentTarget.style.background=unread?T.wash:T.paper}>
                  <UserAvatar name={u.name} size={40} highlight={unread}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:12,fontWeight:700,color:T.ink,fontFamily:"'Archivo Black',sans-serif",letterSpacing:"0.02em"}}>{u.name}</span>
                      {last&&<span style={{fontSize:9,color:T.grey2,fontFamily:"'Courier Prime',monospace"}}>{last.time}</span>}
                    </div>
                    <div style={{fontSize:11,color:T.grey3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Courier Prime',monospace"}}>{last?last.text:"No messages yet"}</div>
                  </div>
                  {unread&&<div style={{width:6,height:6,background:T.red,flexShrink:0}}/>}
                </div>
              );
            })}
          </div>
          :<>
            <div style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:10,background:T.wash}}>
              {(dms[active]||[]).map((m,i)=>{
                const mine=m.from==="me";
                return (
                  <div key={i} style={{display:"flex",flexDirection:mine?"row-reverse":"row",gap:7,alignItems:"flex-end"}}>
                    {!mine&&<UserAvatar name={USERS[active]?.name||"?"} size={24}/>}
                    <div style={{maxWidth:"72%"}}>
                      <div style={{background:mine?T.ink:T.paper,padding:"9px 13px",border:`2px solid ${T.ink}`,boxShadow:mine?"none":`2px 2px 0 ${T.grey1}`}}>
                        <div style={{fontSize:12,color:mine?T.paper:T.ink,lineHeight:1.6,fontFamily:"'Courier Prime',monospace"}}>{m.text}</div>
                        <div style={{fontSize:8,color:mine?T.grey2:T.grey3,marginTop:3,textAlign:mine?"right":"left",fontFamily:"'Courier Prime',monospace"}}>{m.time}</div>
                      </div>
                      {mine&&<div style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3,textAlign:"right",marginTop:2,paddingRight:2}}>{"✓✓"} read</div>}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef}/>
            </div>
            <div style={{padding:"10px 12px",borderTop:`2px solid ${T.ink}`,display:"flex",gap:8,background:T.paper}}>
              <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="type message..." style={INP}/>
              <Btn style={{padding:"9px 14px",fontSize:9}} onClick={send}>SEND</Btn>
            </div>
          </>
        }
      </div>
    </div>
  );
}

/* --- ONBOARDING --- */
function Onboarding({ onComplete }) {
  const [step,setStep]=useState(0);
  const [name,setName]=useState("");
  const [handle,setHandle]=useState("");
  const [styles,setStyles]=useState([]);
  const [followed,setFollowed]=useState({});
  const toggle=s=>setStyles(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]);
  const toggleFollow=id=>setFollowed(f=>({...f,[id]:!f[id]}));

  const FINP={background:T.wash,border:"2px solid "+T.grey2,borderLeft:"2px solid "+T.ink,color:T.ink,padding:"11px 14px",fontSize:13,fontFamily:"'Courier Prime',monospace",outline:"none",width:"100%",boxSizing:"border-box"};
  const LBL={fontSize:9,color:T.grey3,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:6,fontFamily:"'Courier Prime',monospace",fontWeight:700};

  const STEPS=[
    {
      label:"01 / INTRO",
      content:(
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <div style={{fontFamily:"'Rubik Dirt',sans-serif",fontSize:52,lineHeight:.9,color:T.ink,letterSpacing:"-0.02em"}}>
            YOUR<br/>WARD<span style={{color:T.yellow}}>-</span><br/>ROBE.<br/>YOUR<br/>WORLD<span style={{color:T.yellow}}>.</span>
          </div>
          <div style={{borderTop:"2px solid "+T.ink,paddingTop:16,display:"flex",flexDirection:"column",gap:8}}>
            {[["01","Catalogue your clothes digitally"],["02","Share fits with people who get it"],["03","Buy & sell - no middlemen"]].map(([n,t])=>(
              <div key={n} style={{display:"flex",gap:12,alignItems:"baseline"}}>
                <span style={{fontFamily:"'Rubik Dirt',sans-serif",fontSize:14,color:T.yellow,flexShrink:0}}>{n}</span>
                <span style={{fontFamily:"'Courier Prime',monospace",fontSize:12,color:T.grey3}}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{overflow:"hidden",borderTop:"1px solid "+T.grey1,borderBottom:"1px solid "+T.grey1,padding:"7px 0",background:T.wash}}>
            <div style={{animation:"marquee 16s linear infinite",whiteSpace:"nowrap",fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey3,letterSpacing:"0.22em"}}>
              {" "}<span style={{fontFamily:"'Rubik Dirt',sans-serif",color:T.yellow}}>{"VYUU"}</span>{" · BUY SELL SHARE · YOUR WARDROBE YOUR WORLD · "}<span style={{fontFamily:"'Rubik Dirt',sans-serif",color:T.yellow}}>{"VYUU"}</span>{" . BUY SELL SHARE . YOUR WARDROBE YOUR WORLD . "}
            </div>
          </div>
        </div>
      ),
    },
    {
      label:"02 / PROFILE",
      content:(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>
            <UserAvatar name={name||"?"} size={72} highlight={!!name}/>
          </div>
          <div><div style={LBL}>Full Name</div><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Jordan Lee" style={FINP}/></div>
          <div><div style={LBL}>Username</div>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontFamily:"'Courier Prime',monospace",fontSize:13,color:T.grey3}}>@</span>
              <input value={handle} onChange={e=>setHandle(e.target.value)} placeholder="jordanlee" style={{...FINP,paddingLeft:28}}/>
            </div>
          </div>
        </div>
      ),
    },
    {
      label:"03 / STYLE",
      content:(
        <div>
          <p style={{fontFamily:"'Courier Prime',monospace",fontSize:11,color:T.grey3,marginBottom:16,lineHeight:1.7}}>Select all that apply. No wrong answers.</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {STYLE_TAGS.map(s=>{
              const sel=styles.includes(s);
              return <button key={s} onClick={()=>toggle(s)} className="ripple-origin" style={{background:sel?T.ink:"transparent",color:sel?T.paper:T.ink,border:"2px solid "+(sel?T.ink:T.grey2),padding:"8px 14px",fontSize:10,cursor:"pointer",fontFamily:"'Courier Prime',monospace",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",transition:"all .15s cubic-bezier(.2,.8,.4,1.2)",boxShadow:sel?"3px 3px 0 "+T.red:"2px 2px 0 transparent",transform:sel?"translate(-1px,-1px)":"translate(0,0)"}}>{s}</button>;
            })}
          </div>
        </div>
      ),
    },
    {
      label:"04 / FOLLOW",
      content:(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <p style={{fontFamily:"'Courier Prime',monospace",fontSize:11,color:T.grey3,marginBottom:8,lineHeight:1.7}}>Start with some people who share your taste.</p>
          {Object.values(USERS).filter(u=>u.id!=="me").map(u=>{
            const fol=!!followed[u.id];
            return (
              <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,background:T.wash,border:"2px solid "+(fol?T.ink:T.grey1),padding:"12px 14px",transition:"border-color .12s",boxShadow:fol?"3px 3px 0 "+T.ink:"none"}}>
                <UserAvatar name={u.name} size={38} highlight={fol}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:T.ink,fontFamily:"'Archivo Black',sans-serif",letterSpacing:"0.02em"}}>{u.name}</div>
                  <div style={{fontSize:10,color:T.grey3,fontFamily:"'Courier Prime',monospace"}}>@{u.handle}</div>
                </div>
                <Btn variant={fol?"primary":"ghost"} style={{padding:"5px 12px",fontSize:9}} onClick={()=>toggleFollow(u.id)}>{fol?"FOLLOWING":"FOLLOW"}</Btn>
              </div>
            );
          })}
        </div>
      ),
    },
  ];

  const cur=STEPS[step];
  const canNext=step===1?(name.trim().length>1&&handle.trim().length>1):step===2?styles.length>0:true;

  return (
    <div style={{position:"fixed",inset:0,background:T.paper,zIndex:1000,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto",fontFamily:"'Courier Prime',monospace"}}>
      <Grain/>
      <div style={{height:3,background:T.grey1,flexShrink:0}}>
        <div style={{height:"100%",background:T.ink,width:(((step+1)/STEPS.length)*100)+"%",transition:"width .3s ease"}}/>
      </div>
      <div style={{padding:"12px 20px 10px",borderBottom:"2px solid "+T.ink,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,background:T.ink}}>
        <Logo size={28}/>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey2,letterSpacing:"0.14em"}}>{cur.label}</span>
          <button onClick={()=>onComplete({name:"Guest",handle:"guest"+Math.floor(Math.random()*9999),styles:[]})} style={{background:"none",border:"none",color:T.grey3,fontFamily:"'Courier Prime',monospace",fontSize:9,cursor:"pointer",letterSpacing:"0.08em",textDecoration:"underline"}}>skip</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"24px 20px 20px"}}>{cur.content}</div>
      <div style={{padding:"16px 20px 32px",borderTop:"2px solid "+T.ink,display:"flex",gap:10,background:T.paper,flexShrink:0}}>
        {step>0&&<Btn variant="ghost" style={{flex:1}} onClick={()=>setStep(s=>s-1)}>{"←"}</Btn>}
        <Btn style={{flex:2}} disabled={!canNext} onClick={()=>step<STEPS.length-1?setStep(s=>s+1):onComplete({name,handle,styles})}>
          {step===STEPS.length-1?"LET'S GO →":"NEXT →"}
        </Btn>
      </div>
    </div>
  );
}

/* --- POST CARD --- */
/* --- ZINE POST - 5 distinct layouts, assigned by index mod 5 --- */

function ZinePost({ post, idx, onUser, onLike, setAllPosts, onShare, setPosts, onRepost, reposts, onDM, onTag, onSave, saved, onNotify }) {
  var reposted=reposts&&reposts.includes(post.id);
  var isSaved=saved&&saved.includes(post.id);
  // Staggered entry - each post delays by its index, capped at 5
  const delay = Math.min(idx * 0.07, 0.35);
  const user = USERS[post.user];
  const liked = post.likedBy.includes("me");
  const [cmtOpen, setCmtOpen] = useState(false);
  const [cmt, setCmt] = useState("");
  const submit = () => {
    if(!cmt.trim()) return;
    setAllPosts(ps=>ps.map(p=>{
      if(p.id!==post.id) return p;
      if(p.user!=="me"&&onNotify) onNotify({type:"comment",user:p.user,text:'commented: "'+cmt.trim().slice(0,30)+'"'});
      return {...p,comments:[...p.comments,{u:"me",t:cmt.trim()}]};
    }));
    setCmt("");
  };
  const layout = idx % 5;
  const entryStyle = {animation:`fadeUp .4s cubic-bezier(.2,.8,.4,1) ${Math.min(idx*0.07,0.35)}s both`};

  // Shared comment drawer
  const CommentDrawer = () => cmtOpen ? (
    <div style={{borderTop:`2px solid ${T.ink}`,background:T.wash,padding:"12px 14px"}}>
      {post.comments.map((c,i)=>(
        <div key={i} style={{fontSize:11,marginBottom:8,lineHeight:1.65,fontFamily:"'Courier Prime',monospace"}}>
          <span style={{color:T.red,fontWeight:700}}>@{USERS[c.u]?.handle||c.u} </span>
          <span style={{color:T.grey3}}>{c.t}</span>
        </div>
      ))}
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <input value={cmt} onChange={e=>setCmt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="add comment..." style={{flex:1,background:T.paper,border:"none",borderBottom:`2px solid ${T.ink}`,color:T.ink,padding:"7px 0",fontSize:11,outline:"none",fontFamily:"'Courier Prime',monospace"}}/>
        <Btn style={{padding:"5px 10px",fontSize:8}} onClick={submit}>POST</Btn>
      </div>
    </div>
  ) : null;

  // Shared action strip - tactile inline buttons
  const Actions = ({ inv=false }) => (
    <div style={{display:"flex",alignItems:"center",gap:0,borderTop:`1px solid ${inv?"#ffffff22":T.grey1}`}}>
      <button onClick={()=>onLike(post.id)} className="action-btn" style={{background:"none",border:"none",borderRight:`1px solid ${inv?"#ffffff22":T.grey1}`,cursor:"pointer",color:liked?T.red:inv?T.grey2:T.grey3,padding:"9px 14px",fontFamily:"'Courier Prime',monospace",fontSize:13,display:"flex",alignItems:"center",gap:5,transition:"transform .12s, color .12s",WebkitTapHighlightColor:"transparent"}}>
        <span style={{display:"inline-block",transition:"transform .12s",transform:liked?"scale(1.25)":"scale(1)"}}>{liked?"♥":"♥"}</span> {post.likes}
      </button>
      <button onClick={()=>setCmtOpen(o=>!o)} className="action-btn" style={{background:cmtOpen?(inv?"#ffffff18":T.wash):"none",border:"none",borderRight:`1px solid ${inv?"#ffffff22":T.grey1}`,cursor:"pointer",color:cmtOpen?inv?T.paper:T.ink:inv?T.grey2:T.grey3,padding:"9px 14px",fontFamily:"'Courier Prime',monospace",fontSize:11,transition:"background .12s, color .12s",WebkitTapHighlightColor:"transparent"}}>
        // {post.comments.length}
      </button>
      <div style={{marginLeft:"auto",borderLeft:`1px solid ${inv?"#ffffff22":T.grey1}`}}>
        <OOTDVote post={post} setPosts={setAllPosts}/>
      </div>
      <button onClick={()=>onRepost&&onRepost(post.id)} className="action-btn" style={{background:reposted?"rgba(255,229,0,0.08)":"none",border:"none",borderLeft:`1px solid ${inv?"#ffffff22":T.grey1}`,cursor:"pointer",color:reposted?T.yellow:inv?T.grey2:T.grey3,padding:"9px 14px",fontFamily:"'Courier Prime',monospace",fontSize:10,letterSpacing:"0.08em",transition:"color .12s",WebkitTapHighlightColor:"transparent"}}>
        {"↻"} {post.reposts>0&&<span style={{fontSize:9}}>{post.reposts}</span>}
      </button>
      <button onClick={()=>onShare(post)} className="action-btn" style={{background:"none",border:"none",borderLeft:"1px solid "+(inv?"#ffffff22":T.grey1),cursor:"pointer",color:inv?T.grey2:T.grey3,padding:"9px 14px",fontFamily:"'Courier Prime',monospace",fontSize:10,letterSpacing:"0.08em",transition:"color .12s",WebkitTapHighlightColor:"transparent"}}>
        {"↑"}
      </button>
      {onSave&&<button onClick={()=>onSave(post.id)} className="action-btn" style={{background:"none",border:"none",borderLeft:"1px solid "+(inv?"#ffffff22":T.grey1),cursor:"pointer",color:isSaved?T.yellow:inv?T.grey2:T.grey3,padding:"9px 12px",fontFamily:"'Courier Prime',monospace",fontSize:12,transition:"color .12s",WebkitTapHighlightColor:"transparent"}}>{"♡"}</button>}
      {post.user!=="me"&&onDM&&<button onClick={()=>onDM(post.user)} className="action-btn" style={{background:"none",border:"none",borderLeft:"1px solid "+(inv?"#ffffff22":T.grey1),cursor:"pointer",color:inv?T.grey2:T.grey3,padding:"9px 10px",fontFamily:"'Courier Prime',monospace",fontSize:9,letterSpacing:"0.06em",transition:"color .12s",WebkitTapHighlightColor:"transparent"}}>DM</button>}
    </div>
  );

  /* -- LAYOUT 0: BROADSHEET ----------------------------------------------
     Full-width. Big editorial number. Caption runs in narrow column right.  */
  if (layout === 0) return (
    <article style={{borderBottom:`3px solid ${T.ink}`,marginBottom:0}}>
      <div style={{display:"flex",borderBottom:`1px solid ${T.grey1}`}}>
        {/* left: giant issue number + byline */}
        <div style={{width:72,flexShrink:0,borderRight:`2px solid ${T.ink}`,padding:"14px 0",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",background:T.wash}}>
          <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:44,color:T.ink,lineHeight:1,letterSpacing:"-0.04em",writingMode:"vertical-lr",transform:"rotate(180deg)",padding:"0 10px"}}>
            {String(post.likes).padStart(3,"0")}
          </div>
          <div style={{padding:"0 8px",textAlign:"center"}}>
            <div style={{fontSize:7,color:T.grey3,fontFamily:"'Courier Prime',monospace",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>{post.time}</div>
            <div style={{fontSize:7,color:T.grey3,fontFamily:"'Courier Prime',monospace",letterSpacing:"0.08em",textTransform:"uppercase"}}>{post.cat}</div>
          </div>
        </div>
        {/* right: photo + caption */}
        <div style={{flex:1,display:"flex",flexDirection:"column"}}>
          <ItemPhoto img={post.img} category={post.cat} brand="" height={220}/>
          <div style={{padding:"10px 13px 6px",borderTop:`1px solid ${T.grey1}`}}>
            <div style={{display:"flex",gap:6,marginBottom:6}}>
              <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:11,color:T.ink,cursor:"pointer"}} onClick={()=>onUser(post.user)}>{user.name}</span>
              <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3,lineHeight:1.8}}>@{user.handle}</span>
            </div>
            <div style={{fontSize:11,color:T.stamp,lineHeight:1.75,fontFamily:"'Courier Prime',monospace"}}>{post.caption}</div>
          </div>
          {post.tags.length>0&&<div style={{padding:"0 13px 10px",display:"flex",gap:4,flexWrap:"wrap"}}>
            {post.tags.slice(0,3).map(t=><button key={t} onClick={()=>onTag&&onTag(t)} style={{fontSize:8,color:T.grey3,fontFamily:"'Courier Prime',monospace",letterSpacing:"0.06em",background:"none",border:"none",cursor:"pointer",padding:0}}>#{t}</button>)}{post.items&&post.items.length>0&&<span style={{fontSize:7,color:T.grey3,fontFamily:"'Courier Prime',monospace",marginLeft:4,border:"1px solid "+T.grey1,padding:"1px 5px"}}>x {post.items.length} piece{post.items.length>1?"s":""}</span>}
          </div>}
        </div>
      </div>
      <Actions/>
      <CommentDrawer/>
    </article>
  );

  /* -- LAYOUT 1: FULL BLEED DARK -----------------------------------------
     Ink background. White type. Caption overlaid at bottom.               */
  if (layout === 1) return (
    <article style={{background:T.ink,borderBottom:`3px solid ${T.ink}`,marginBottom:0}}>
      <div style={{position:"relative"}}>
        <ItemPhoto img={post.img} category={post.cat} brand="" height={360}/>
        {/* name stamp - top left */}
        <div style={{position:"absolute",top:0,left:0,background:T.ink,padding:"6px 12px",cursor:"pointer"}} onClick={()=>onUser(post.user)}>
          <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.paper,letterSpacing:"0.06em"}}>{user.name.toUpperCase()}</div>
          <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>@{user.handle} . {post.time}</div>
        </div>
        {/* like count - top right */}
        <div style={{position:"absolute",top:0,right:0,background:liked?T.red:"transparent",border:liked?"none":`1px solid #ffffff33`,padding:"6px 11px",cursor:"pointer"}} onClick={()=>onLike(post.id)}>
          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:11,color:liked?T.paper:T.grey2}}>{liked?"♥":"♥"} {post.likes}</span>
        </div>
        {/* caption overlay - bottom */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(13,13,13,.92))",padding:"32px 14px 14px"}}>
          <div style={{fontSize:12,color:T.paper,lineHeight:1.7,fontFamily:"'Courier Prime',monospace",fontStyle:"italic"}}>{post.caption}</div>
          {post.tags.length>0&&<div style={{marginTop:6,display:"flex",gap:6}}>
            {post.tags.slice(0,3).map(t=><span key={t} style={{fontSize:8,color:"#ffffff66",fontFamily:"'Courier Prime',monospace"}}>#{t}</span>)}
          </div>}
        </div>
      </div>
      <Actions inv/>
      <CommentDrawer/>
    </article>
  );

  /* -- LAYOUT 2: COLUMN + PULL QUOTE ------------------------------------
     Two-column. Left: narrow photo. Right: massive pull-quote headline.   */
  if (layout === 2) return (
    <article style={{borderBottom:`3px solid ${T.ink}`,marginBottom:0}}>
      <div style={{display:"flex",gap:0,minHeight:280}}>
        {/* narrow left photo */}
        <div style={{width:"42%",flexShrink:0,borderRight:`2px solid ${T.ink}`}}>
          <ItemPhoto img={post.img} category={post.cat} brand="" height={280}/>
        </div>
        {/* right: pull quote */}
        <div style={{flex:1,padding:"16px 14px",display:"flex",flexDirection:"column",justifyContent:"space-between",background:T.wash}}>
          {/* category stamp */}
          <div>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.red,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8}}>{post.cat.toUpperCase()} .. {post.time}</div>
            {/* pull quote - first sentence big */}
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:17,color:T.ink,lineHeight:1.15,letterSpacing:"-0.01em",marginBottom:10}}>
              "{post.caption.split(".")[0]}."
            </div>
            <div style={{fontSize:10,color:T.grey3,lineHeight:1.7,fontFamily:"'Courier Prime',monospace"}}>
              {post.caption.slice(post.caption.indexOf(".")+1).trim()}
            </div>
          </div>
          {/* byline + tags bottom */}
          <div>
            {post.tags.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
              {post.tags.slice(0,3).map(t=><span key={t} style={{fontSize:8,color:T.grey3,border:`1px solid ${T.grey1}`,padding:"1px 5px",fontFamily:"'Courier Prime',monospace",letterSpacing:"0.06em"}}>#{t}</span>)}
            </div>}
            <div style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer"}} onClick={()=>onUser(post.user)}>
              <UserAvatar name={user.name} size={22}/>
              <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.ink,letterSpacing:"0.02em"}}>{user.name}</span>
            </div>
          </div>
        </div>
      </div>
      <Actions/>
      <CommentDrawer/>
    </article>
  );

  /* -- LAYOUT 3: CLASSIFIED AD ------------------------------------------
     No photo. Pure text. Feels like a newspaper classified listing.       */
  if (layout === 3) return (
    <article style={{borderBottom:`3px solid ${T.ink}`,background:T.paper,marginBottom:0}}>
      <div style={{padding:"18px 16px 14px",borderLeft:`5px solid ${T.ink}`}}>
        {/* header rule */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10,paddingBottom:8,borderBottom:`1px solid ${T.grey1}`}}>
          <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:9,color:T.ink,letterSpacing:"0.14em"}}>{post.cat.toUpperCase()} - {user.name.toUpperCase()}</div>
          <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>{post.time}</div>
        </div>
        {/* big caption - classified body text style */}
        <div style={{fontFamily:"'Courier Prime',monospace",fontSize:13,color:T.ink,lineHeight:1.8,marginBottom:12}}>{post.caption}</div>
        {/* tags as classified codes */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
          {post.tags.map(t=><span key={t} style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3,letterSpacing:"0.1em",textTransform:"uppercase"}}>#{t}</span>)}
        </div>
        {/* contact line */}
        <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:8,borderTop:`1px solid ${T.grey1}`,cursor:"pointer"}} onClick={()=>onUser(post.user)}>
          <UserAvatar name={user.name} size={20}/>
          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3,letterSpacing:"0.08em"}}>@{user.handle} {"·"} {post.likes} likes</span>
          <button onClick={(e)=>{e.stopPropagation();onLike(post.id);}} style={{marginLeft:"auto",background:liked?T.ink:"none",border:`1px solid ${liked?T.ink:T.grey2}`,color:liked?T.paper:T.grey3,padding:"3px 8px",cursor:"pointer",fontFamily:"'Courier Prime',monospace",fontSize:10,transition:"all .12s"}}>{liked?"♥":"♥"}</button>
        </div>
      </div>
      <Actions/>
      <CommentDrawer/>
    </article>
  );

  /* -- LAYOUT 4: MAGAZINE SPREAD ----------------------------------------
     Full-width photo. Oversized byline below. Very editorial.             */
  return (
    <div style={{animation:`fadeUp .38s cubic-bezier(.2,.8,.4,1) ${Math.min(idx*0.07,0.35)}s both`}}>
    <article style={{borderBottom:`3px solid ${T.ink}`,marginBottom:0}}>
      <ItemPhoto img={post.img} category={post.cat} brand="" height={320}/>
      {/* below image - split layout */}
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:0,borderTop:`3px solid ${T.ink}`}}>
        {/* left strip - rotated handle */}
        <div style={{width:44,borderRight:`2px solid ${T.ink}`,background:T.ink,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}} onClick={()=>onUser(post.user)}>
          <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:8,color:T.grey3,writingMode:"vertical-lr",letterSpacing:"0.12em",textTransform:"uppercase"}}>@{user.handle}</span>
        </div>
        {/* right - caption + meta */}
        <div style={{padding:"14px 14px 12px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:18,color:T.ink,letterSpacing:"-0.01em",lineHeight:1}}>{user.name}</div>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>{post.time}</div>
          </div>
          <div style={{fontFamily:"'Courier Prime',monospace",fontSize:11,color:T.stamp,lineHeight:1.8,marginBottom:8}}>{post.caption}</div>
          {post.tags.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {post.tags.slice(0,4).map(t=><span key={t} style={{fontSize:8,color:T.grey3,fontFamily:"'Courier Prime',monospace"}}>#{t}</span>)}
          </div>}
        </div>
      </div>
      <Actions/>
      <CommentDrawer/>
    </article>
    </div>
  );
}

/* --- LISTING CARD --- */
function ListingCard({ listing, onOpen }) {
  const [hov,setHov]=useState(false);
  const topBid=listing.bids[0]?.a;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>onOpen(listing)}
      style={{background:T.paper,border:`2px solid ${T.ink}`,cursor:"pointer",overflow:"hidden",transition:"box-shadow .1s, transform .1s",transform:hov?"translate(-2px,-2px)":"none",boxShadow:hov?`6px 6px 0 ${T.ink}`:`4px 4px 0 ${T.ink}`}}>
      <div style={{position:"relative"}}>
        <ItemPhoto img={listing.img||null} category={listing.cat} brand={listing.brand} height={180} small/>
        {listing.auction&&<RedStamp style={{position:"absolute",top:8,left:8}}>Auction</RedStamp>}
        {listing.cond==="Deadstock"&&<span style={{position:"absolute",top:listing.auction?32:8,left:8,fontFamily:"'Archivo Black',sans-serif",fontSize:8,color:T.ink,background:T.paper,border:`2px solid ${T.ink}`,padding:"1px 6px",letterSpacing:"0.08em"}}>DEADSTOCK</span>}
        {listing.watchAlert&&<span style={{position:"absolute",top:8,left:8,fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.paper,background:T.red,padding:"2px 6px",letterSpacing:"0.06em"}}>PRICE DROP</span>}
        {listing.verified&&<span style={{position:"absolute",top:8,right:8,fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.paper,background:"#1A6B3A",border:"1px solid #2A8B4A",padding:"2px 7px",letterSpacing:"0.1em"}}>{"✓"} VERIFIED</span>}
      </div>
      <div style={{padding:"11px 12px 13px",borderTop:`2px solid ${T.ink}`}}>
        {/* Brand + condition row */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
          <div style={{fontSize:9,color:T.grey3,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Courier Prime',monospace",display:"block"}}>{listing.brand}</div>
          <CondBadge cond={listing.cond}/>
        </div>
        {/* Title */}
        <div style={{fontSize:12,color:T.ink,lineHeight:1.3,marginBottom:8,fontFamily:"'Archivo Black',sans-serif",letterSpacing:"0.01em"}}>{listing.title}</div>
        {/* Price - dominant */}
        <div style={{display:"flex",alignItems:"baseline",gap:6,paddingBottom:8,borderBottom:`1px solid ${T.grey1}`,marginBottom:8}}>
          <span style={{fontSize:26,fontFamily:"'Archivo Black',sans-serif",color:T.ink,lineHeight:1}}>${listing.price}</span>
          {listing.retail>listing.price&&<span style={{fontSize:9,color:T.grey2,textDecoration:"line-through",fontFamily:"'Courier Prime',monospace"}}>${listing.retail} retail</span>}
        </div>
        {/* Auction status */}
        {listing.auction&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          {topBid&&<div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.red}}>^ ${topBid} <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>top bid</span></div>}
          {listing.ends&&<div style={{fontSize:8,color:T.grey3,fontFamily:"'Courier Prime',monospace",letterSpacing:"0.08em"}}>{listing.ends} left</div>}
        </div>}
        {/* Seller + size */}
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <UserAvatar name={USERS[listing.user]?.name||"?"} size={14}/>
          <span style={{fontSize:8,color:T.grey3,fontFamily:"'Courier Prime',monospace",flex:1}}>@{USERS[listing.user]?.handle}</span>
          <span style={{fontSize:8,color:T.grey3,fontFamily:"'Courier Prime',monospace",letterSpacing:"0.08em"}}>sz {listing.size}</span>
        </div>
      </div>
    </div>
  );
}

/* --- LISTING MODAL --- */
function ListingModal({ listing, onClose, onShare, onDM, onNotify, watched, onWatch, onSold, onUpdateOffers }) {
  const user=USERS[listing.user];
  const [bids,setBids]=useState(listing.bids);
  const [offers,setOffers]=useState(listing.offers);
  const [phase,setPhase]=useState("view");
  const [amount,setAmount]=useState("");
  const topBid=bids[0]?.a||0;
  const submitBid=()=>{const a=parseInt(amount);if(!a||a<=topBid)return;setBids(b=>[{u:"me",a},...b].sort((x,y)=>y.a-x.a));if(onNotify)onNotify({type:"bid",listing:listing.title,amount:a});setPhase("success");};
  const submitOffer=()=>{if(!amount)return;setOffers(o=>[{u:"me",a:parseInt(amount),s:"pending"},...o]);if(onNotify)onNotify({type:"offer",listing:listing.title,amount:parseInt(amount)});setPhase("success");};
  const LBL={fontSize:9,color:T.grey3,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:5,fontFamily:"'Courier Prime',monospace",fontWeight:700};
  const INP={background:T.wash,border:`2px solid ${T.grey2}`,borderLeft:`2px solid ${T.ink}`,color:T.ink,padding:"9px 12px",fontSize:12,fontFamily:"'Courier Prime',monospace",outline:"none",width:"100%",boxSizing:"border-box"};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(13,13,13,.8)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{background:T.paper,border:`3px solid ${T.ink}`,boxShadow:`8px 8px 0 ${T.ink}`,width:"min(860px,100%)",maxHeight:"92vh",overflow:"auto",position:"relative",animation:"slideUp .3s cubic-bezier(.2,.8,.4,1)"}} onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{position:"absolute",top:12,right:12,background:T.ink,border:"none",color:T.paper,width:28,height:28,cursor:"pointer",fontSize:13,zIndex:10,fontFamily:"'Archivo Black',sans-serif"}}>{"×"}</button>
        <div style={{display:"flex",flexWrap:"wrap"}}>
          {/* photo */}
          <div style={{flex:"0 0 320px",minWidth:260}}>
            <ItemPhoto img={listing.img||null} category={listing.cat} brand={listing.brand} height={420}/>
            {listing.auction&&(
              <div style={{padding:"10px 14px",background:T.ink,borderTop:`2px solid ${T.ink}`}}>
                <RedStamp>LIVE AUCTION</RedStamp>
                <span style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey2,marginLeft:10}}>{listing.ends} remaining</span>
              </div>
            )}
          </div>
          {/* details */}
          <div style={{flex:1,padding:"24px 22px",display:"flex",flexDirection:"column",gap:14,minWidth:260,borderLeft:`3px solid ${T.ink}`}}>
            <div style={{fontSize:9,color:T.grey3,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Courier Prime',monospace",display:"block"}}>{listing.brand}</div>
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:20,color:T.ink,lineHeight:1.1,letterSpacing:"0.01em"}}>{listing.title}</div>
            {/* seller */}
            <div style={{display:"flex",alignItems:"center",gap:8,paddingBottom:12,borderBottom:`2px solid ${T.ink}`}}>
              <UserAvatar name={user.name} size={26}/>
              <div>
                <div style={{fontSize:12,color:T.ink,fontFamily:"'Archivo Black',sans-serif"}}>{user.name}</div>
                <div style={{fontSize:9,color:T.grey3,fontFamily:"'Courier Prime',monospace"}}>@{user.handle}</div>
              </div>
              {listing.verified?<span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:"#fff",background:"#1A6B3A",padding:"2px 7px",marginLeft:"auto",letterSpacing:"0.08em"}}>{"✓"} VERIFIED</span>:<span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,border:"1px solid "+T.grey1,padding:"2px 7px",marginLeft:"auto"}}>UNVERIFIED</span>}
              <button onClick={()=>{onClose();onDM(listing.user);}} style={{background:"none",border:`2px solid ${T.grey2}`,color:T.grey3,padding:"4px 10px",fontSize:9,cursor:"pointer",fontFamily:"'Courier Prime',monospace",letterSpacing:"0.08em",marginLeft:"0",transition:"all .1s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.ink;e.currentTarget.style.color=T.ink;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.grey2;e.currentTarget.style.color=T.grey3;}}>MSG</button>
            </div>
            {/* specs */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
              {[["Condition",<CondBadge cond={listing.cond}/>],["Size",listing.size],["Category",listing.cat]].map(([k,v])=>(
                <div key={k} style={{background:T.wash,border:`2px solid ${T.grey1}`,borderTop:`2px solid ${T.ink}`,padding:"8px 10px"}}>
                  <div style={LBL}>{k}</div>
                  <div style={{fontSize:11,color:T.ink,fontFamily:"'Courier Prime',monospace"}}>{v}</div>
                </div>
              ))}
            </div>
            {(listing.chest||listing.waist||listing.hips)&&(
              <div style={{display:"flex",gap:6,marginTop:4}}>
                {listing.chest&&<span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3,border:"1px solid "+T.grey1,padding:"2px 7px"}}>Chest {listing.chest}"</span>}
                {listing.waist&&<span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3,border:"1px solid "+T.grey1,padding:"2px 7px"}}>Waist {listing.waist}"</span>}
                {listing.hips&&<span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3,border:"1px solid "+T.grey1,padding:"2px 7px"}}>Hips {listing.hips}"</span>}
              </div>
            )}
            {/* desc */}
            <div style={{fontSize:11,color:T.grey3,lineHeight:1.8,fontFamily:"'Courier Prime',monospace"}}>{listing.desc}</div>
            {/* price */}
            <div style={{display:"flex",gap:16,alignItems:"flex-end",paddingTop:8,borderTop:`2px solid ${T.ink}`}}>
              <div>
                <div style={LBL}>Asking</div>
                <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:52,color:T.ink,lineHeight:.9,letterSpacing:"-0.02em"}}>${listing.price}</div>
              </div>
              {listing.retail>listing.price&&<div>
                <div style={LBL}>Retail</div>
                <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:20,color:T.grey2,position:"relative"}}><span style={{textDecoration:"line-through"}}>${listing.retail}</span><span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3,display:"block",marginTop:2}}>retail</span></div>
              </div>}
            </div>
            {/* savings badge */}
            {listing.retail>listing.price&&(
              <div style={{display:"inline-flex",alignItems:"center",gap:6,background:T.red,padding:"3px 10px",alignSelf:"flex-start"}}>
                <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:11,color:T.paper}}>
                  {Math.round((1-listing.price/listing.retail)*100)}% OFF RETAIL
                </span>
              </div>
            )}
            {/* actions */}
            {phase==="view"&&(
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Btn variant="red" style={{flex:1}} onClick={()=>{if(listing.user==="me"&&onSold)onSold(listing);onClose();}}>BUY NOW - ${listing.price}</Btn>
                {listing.auction
                  ?<Btn variant="ghost" style={{flex:1}} onClick={()=>setPhase("bid")}>BID{topBid?` . $${topBid}`:""}</Btn>
                  :<Btn variant="ghost" style={{flex:1}} onClick={()=>setPhase("offer")}>OFFER</Btn>
                }
                <button onClick={()=>onShare(listing)} style={{background:"none",border:`2px solid ${T.grey2}`,color:T.grey3,padding:"0 12px",cursor:"pointer",fontFamily:"'Courier Prime',monospace",fontSize:11,transition:"all .1s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.ink;e.currentTarget.style.color=T.ink;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.grey2;e.currentTarget.style.color=T.grey3;}}>^</button>
              </div>
            )}
            {(phase==="bid"||phase==="offer")&&(
              <div style={{background:T.wash,border:`2px solid ${T.ink}`,padding:16}}>
                <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:12,color:T.ink,marginBottom:12,letterSpacing:"0.06em"}}>{phase==="bid"?"PLACE A BID":"MAKE AN OFFER"}</div>
                {phase==="bid"&&bids.length>0&&(
                  <div style={{marginBottom:12}}>
                    {bids.map((b,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.grey1}`}}>
                        <span style={{fontSize:10,color:i===0?T.ink:T.grey3,fontFamily:"'Courier Prime',monospace"}}>@{USERS[b.u]?.handle||b.u}{i===0&&<RedStamp style={{marginLeft:6,fontSize:7}}>leading</RedStamp>}</span>
                        <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:14,color:i===0?T.ink:T.grey2}}>${b.a}</span>
                      </div>
                    ))}
                    <div style={{fontSize:9,color:T.grey3,marginTop:5,fontFamily:"'Courier Prime',monospace"}}>must exceed ${topBid}</div>
                  </div>
                )}
                <div style={{display:"flex",alignItems:"center",background:T.paper,border:`2px solid ${T.ink}`,padding:"8px 12px",gap:4,marginBottom:10}}>
                  <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:24,color:T.ink}}>$</span>
                  <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={phase==="bid"?topBid+1:listing.price} style={{background:"none",border:"none",color:T.ink,fontSize:24,width:"100%",outline:"none",fontFamily:"'Courier Prime',monospace"}}/>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <Btn style={{flex:1}} onClick={phase==="bid"?submitBid:submitOffer}>CONFIRM</Btn>
                  <Btn variant="ghost" onClick={()=>setPhase("view")}>CANCEL</Btn>
                </div>
              </div>
            )}
            {listing.user==="me"&&offers.length>0&&phase==="view"&&(
              <div style={{marginTop:12,borderTop:"2px solid "+T.ink,paddingTop:12}}>
                <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.ink,letterSpacing:"0.1em",marginBottom:8}}>INCOMING OFFERS</div>
                {offers.map((o,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid "+T.grey1}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.ink}}>@{USERS[o.u]?.handle||o.u}</div>
                      <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:14,color:T.ink}}>${o.a}</div>
                    </div>
                    {o.s==="pending"&&(
                      <div style={{display:"flex",gap:5}}>
                        <button onClick={()=>{var updated=[...offers];updated[i]={...o,s:"accepted"};setOffers(updated);if(onUpdateOffers)onUpdateOffers(updated);if(onNotify)onNotify({type:"offer_accepted",listing:listing.title,amount:o.a});}} style={{background:"#1A6B3A",border:"none",color:"#fff",padding:"4px 10px",fontFamily:"'Courier Prime',monospace",fontSize:8,cursor:"pointer",letterSpacing:"0.08em"}}>ACCEPT</button>
                        <button onClick={()=>{var updated=[...offers];updated[i]={...o,s:"declined"};setOffers(updated);if(onUpdateOffers)onUpdateOffers(updated);}} style={{background:"none",border:"1px solid "+T.grey2,color:T.grey3,padding:"4px 10px",fontFamily:"'Courier Prime',monospace",fontSize:8,cursor:"pointer",letterSpacing:"0.08em"}}>DECLINE</button>
                        <button onClick={()=>{setAmount(Math.round(o.a*1.1).toString());setPhase("counter");}} style={{background:"none",border:"1px solid "+T.ink,color:T.ink,padding:"4px 10px",fontFamily:"'Courier Prime',monospace",fontSize:8,cursor:"pointer",letterSpacing:"0.08em"}}>COUNTER</button>
                      </div>
                    )}
                    {o.s!=="pending"&&<span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:o.s==="accepted"?"#1A6B3A":T.grey3,border:"1px solid "+(o.s==="accepted"?"#1A6B3A":T.grey1),padding:"3px 8px",textTransform:"uppercase"}}>{o.s}</span>}
                  </div>
                ))}
              </div>
            )}
            {phase==="counter"&&(
              <div style={{marginTop:12}}>
                <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:11,color:T.ink,marginBottom:8}}>SEND COUNTER OFFER</div>
                <div style={{display:"flex",alignItems:"center",background:T.paper,border:"2px solid "+T.ink,padding:"8px 12px",gap:4,marginBottom:10}}>
                  <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:24,color:T.ink}}>$</span>
                  <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={{background:"none",border:"none",color:T.ink,fontSize:24,width:"100%",outline:"none",fontFamily:"'Courier Prime',monospace"}}/>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <Btn style={{flex:1}} onClick={()=>{if(onNotify)onNotify({type:"counter",listing:listing.title,amount:parseInt(amount)});setPhase("success");}}>SEND COUNTER</Btn>
                  <Btn variant="ghost" onClick={()=>setPhase("view")}>CANCEL</Btn>
                </div>
              </div>
            )}
            {phase==="success"&&(
              <div style={{background:T.wash,border:`2px solid ${T.ink}`,padding:24,textAlign:"center"}}>
                <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:28,color:T.ink,marginBottom:8}}>DONE.</div>
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:11,color:T.grey3,marginBottom:16}}>{listing.auction?"Bid placed.":"Offer sent."} Seller will respond within 24h.</div>
                <Btn variant="ghost" onClick={()=>setPhase("view")}>{"←"}</Btn>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- PROFILE VIEW --- */
function ProfileView({ uid, posts, listings, onDM, following, onFollow, onToggleShop, saved, soldItems, onEditProfile, onReport, onBlock, ratings, onRate, onUser }) {
  const user=USERS[uid];
  const uPosts=posts.filter(p=>p.user===uid);
  const savedPosts=(saved||[]).map(id=>posts.find(p=>p.id===id)).filter(Boolean);
  const uListings=listings.filter(l=>l.user===uid);
  const [tab,setTab]=useState("posts");
  const isMine=uid==="me";
  return (
    <div>
      {/* header - big type, zine layout */}
      <div style={{padding:"28px 18px 20px",borderBottom:`2px solid ${T.ink}`,background:T.wash}}>
        <div style={{display:"flex",gap:16,alignItems:"flex-start",marginBottom:14}}>
          <UserAvatar name={user.name} size={64}/>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:22,color:T.ink,lineHeight:1,letterSpacing:"-0.01em"}}>{user.name}</div>
              {user.isShop&&<span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:7,color:T.paper,background:T.red,padding:"2px 7px",letterSpacing:"0.1em",flexShrink:0}}>SHOP</span>}
            </div>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey3,marginBottom:8}}>@{user.handle}</div>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:11,color:T.grey3,lineHeight:1.7}}>{user.bio}</div>
          </div>
        </div>
        {/* style tags */}
        {user.styles&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
          {user.styles.map(s=><InkTag key={s}>{s}</InkTag>)}
        </div>}
        {/* stats */}
        <div style={{display:"flex",gap:0,borderTop:`2px solid ${T.ink}`,borderBottom:`2px solid ${T.ink}`,marginBottom:14}}>
          {(()=>{
  var userRatings=ratings&&ratings[uid]||[];
  var avgRating=userRatings.length>0?(userRatings.reduce((s,r)=>s+r.stars,0)/userRatings.length).toFixed(1):null;
  return [["Posts",uPosts.length],["Followers",user.followers.toLocaleString()],["Following",user.following],...(avgRating?[["Rating",avgRating+"★"]]:[])];
})().map(([l,v],i)=>(
            <div key={l} style={{flex:1,padding:"10px 14px",textAlign:"center",borderRight:i<2?`2px solid ${T.ink}`:"none"}}>
              <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:22,color:T.ink,lineHeight:1}}>{v}</div>
              <div style={{fontSize:8,color:T.grey3,textTransform:"uppercase",letterSpacing:"0.14em",fontFamily:"'Courier Prime',monospace"}}>{l}</div>
            </div>
          ))}
        </div>
        {uid!=="me"&&onRate&&soldItems&&soldItems.some(s=>s.user===uid)&&!ratings[uid]&&(
  <button onClick={()=>{
    var stars=window.confirm("Leave 5 stars for @"+(USERS[uid]?.handle||uid)+"?")?5:window.confirm("3 stars?")?3:1;
    onRate(uid,stars,"Great seller!");
  }} style={{width:"100%",background:T.wash,border:"2px solid "+T.yellow,color:T.ink,padding:"8px 12px",fontFamily:"'Courier Prime',monospace",fontSize:9,cursor:"pointer",letterSpacing:"0.1em",marginBottom:6}}>{"★"} LEAVE A RATING</button>
)}
{uid!=="me"&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
  <Btn style={{flex:1,background:following&&following.includes(uid)?T.grey1:"",color:following&&following.includes(uid)?T.ink:""}} onClick={()=>onFollow&&onFollow(uid)}>{following&&following.includes(uid)?"FOLLOWING":"FOLLOW"}</Btn>
  <Btn variant="ghost" style={{flex:1,padding:"9px 14px"}} onClick={()=>onDM(uid)}>MESSAGE</Btn>
  <button onClick={()=>onReport&&onReport(uid)} style={{background:"none",border:"1px solid "+T.grey1,color:T.grey3,padding:"5px 10px",fontFamily:"'Courier Prime',monospace",fontSize:8,cursor:"pointer",letterSpacing:"0.06em"}}>REPORT</button>
  <button onClick={()=>onBlock&&onBlock(uid)} style={{background:"none",border:"1px solid "+T.grey1,color:T.grey3,padding:"5px 10px",fontFamily:"'Courier Prime',monospace",fontSize:8,cursor:"pointer",letterSpacing:"0.06em"}}>BLOCK</button>
</div>}
        {uid!=="me"&&(()=>{
  var af=Object.values(USERS).filter(u=>u.id!=="me"&&u.id!==uid&&following&&following.includes(u.id)).slice(0,3);
  if(!af.length) return null;
  return (<div style={{marginTop:10,padding:"10px 0",borderTop:"1px solid "+T.grey1}}>
    <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.12em",marginBottom:8}}>PEOPLE YOU ALSO FOLLOW</div>
    <div style={{display:"flex",gap:12}}>
      {af.map(u=>(<button key={u.id} onClick={()=>onUser&&onUser(u.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer"}}>
        <UserAvatar name={u.name} size={36} highlight={true}/>
        <span style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3}}>@{u.handle}</span>
      </button>))}
    </div>
  </div>);
})()}
{uid==="me"&&<div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}><Btn variant="ghost" onClick={()=>onEditProfile&&onEditProfile()} style={{fontSize:8,padding:"5px 14px"}}>EDIT PROFILE</Btn><Btn variant="ghost" onClick={()=>onToggleShop&&onToggleShop()} style={{fontSize:8,padding:"5px 14px"}}>{user.isShop?"SWITCH TO PERSONAL":"SWITCH TO SHOP"}</Btn></div>}
      </div>
      {/* tabs */}
      <div style={{display:"flex",borderBottom:`2px solid ${T.ink}`}}>
        {(isMine?["posts","listings","saved","sold"]:["posts","listings"]).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,background:tab===t?T.ink:T.paper,border:"none",color:tab===t?T.paper:T.grey3,padding:"12px",fontSize:10,cursor:"pointer",fontFamily:"'Archivo Black',sans-serif",letterSpacing:"0.06em",textTransform:"uppercase",borderBottom:"none",transition:"all .12s",borderRight:t==="posts"?`2px solid ${T.ink}`:"none"}}>
            {t==="posts"?"POSTS":t==="listings"?"FOR SALE":t==="saved"?"SAVED":"SOLD"}
          </button>
        ))}
      </div>
      {tab==="posts"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
          {uPosts.map((p,i)=>(
            <div key={p.id} style={{overflow:"hidden",position:"relative",borderRight:i%2===0?`1px solid ${T.grey1}`:"none",borderBottom:`1px solid ${T.grey1}`}}>
              <ItemPhoto img={p.img} category={p.cat} brand="" height={140} small/>
              <div style={{padding:"6px 8px",background:T.paper}}>
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>{"♥"} {p.likes}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab==="saved"&&(savedPosts.length>0
        ?<div>{savedPosts.map((p,i)=>(
          <div key={p.id} style={{borderBottom:"1px solid "+T.grey1,padding:"12px 14px"}}>
            <ItemPhoto img={p.img||null} category={p.cat} brand={USERS[p.user]?.name||""} height={100}/>
            <div style={{paddingTop:8}}><div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey3,marginBottom:3}}>@{USERS[p.user]?.handle}</div>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:11,color:T.ink,lineHeight:1.5}}>{p.caption.slice(0,80)}</div></div>
          </div>
        ))}</div>
        :<div style={{padding:"40px 20px",textAlign:"center"}}><div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:20,color:T.grey1}}>NOTHING SAVED.</div></div>
      )}
      {tab==="sold"&&((!soldItems||soldItems.length===0)
        ?<div style={{padding:"40px 20px",textAlign:"center"}}><div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:20,color:T.grey1}}>NOTHING SOLD YET.</div></div>
        :<div style={{padding:"0 14px"}}>
          <div style={{padding:"10px 0",borderBottom:"1px solid "+T.grey1,marginBottom:10}}>
            <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>TOTAL EARNED: </span>
            <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:14,color:T.ink}}>${(soldItems||[]).reduce((s,i)=>s+i.soldAt,0)}</span>
          </div>
          {(soldItems||[]).map(item=>(
            <div key={item.id+(item.soldDate||"")} style={{display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid "+T.grey1,padding:"10px 0"}}>
              <ItemPhoto img={item.img||null} category={item.cat} brand="" height={50} small/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:11,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,marginTop:2}}>{item.soldDate}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:14,color:T.ink}}>${item.soldAt}</div>
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3}}>sold</div>
              </div>
            </div>
          ))}
        </div>)
      }
      {tab==="listings"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:12}}>
          {uListings.map(l=>(
            <div key={l.id} style={{background:T.paper,border:`2px solid ${T.ink}`,overflow:"hidden"}}>
              <ItemPhoto img={l.img||null} category={l.cat} brand={l.brand} height={100} small/>
              <div style={{padding:"8px 10px",borderTop:`2px solid ${T.ink}`}}>
                <div style={{fontSize:11,color:T.ink,fontFamily:"'Archivo Black',sans-serif",marginBottom:3,letterSpacing:"0.01em"}}>{l.title}</div>
                <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:16,color:T.ink}}>${l.price}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- SCANNER --- */
function Scanner({ onClose, onResult }) {
  const vid=useRef(),can=useRef(),stream=useRef(),fileRef=useRef();
  const [phase,setPhase]=useState("idle");
  const [cap,setCap]=useState(null);
  const [res,setRes]=useState(null);
  const [camErr,setCamErr]=useState(false);
  const [dots,setDots]=useState(0);
  const stopCam=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;};
  const startCam=async()=>{try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}});stream.current=s;vid.current.srcObject=s;await vid.current.play();setPhase("camera");}catch{setCamErr(true);}};
  const capture=()=>{const v=vid.current,c=can.current;c.width=v.videoWidth;c.height=v.videoHeight;c.getContext("2d").drawImage(v,0,0);setCap(c.toDataURL("image/jpeg",.85));stopCam();setPhase("preview");};
  const handleFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setCap(ev.target.result);setPhase("preview");};r.readAsDataURL(f);};
  const analyze=async()=>{
    setPhase("scanning");
    try{
      const b64=cap.split(",")[1],mt=cap.startsWith("data:image/png")?"image/png":"image/jpeg";
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:mt,data:b64}},{type:"text",text:'Fashion expert. Return ONLY raw JSON: {"name":"","brand":"","category":"Tops|Bottoms|Outerwear|Dresses|Shoes|Accessories","color":"hex","material":"","size":"","notes":""}'}]}]})});
      if(!r.ok){setPhase("manual");return;}
      const d=await r.json();
      const raw=(d.content||[]).find(b=>b.type==="text")?.text||"";
      const m=raw.match(/\{[\s\S]*\}/);
      if(!m){setPhase("manual");return;}
      setRes(JSON.parse(m[0]));setPhase("done");
    }catch{setPhase("manual");}
  };
  const confirm=()=>{onResult({...res,id:null,chest:"",waist:"",hips:"",len:"",inseam:"",colorIdx:0,img:cap});stopCam();onClose();};
  useEffect(()=>()=>stopCam(),[]);
  useEffect(()=>{
    if(phase!=="scanning") return;
    const t=setInterval(()=>setDots(d=>(d+1)%4),400);
    return ()=>clearInterval(t);
  },[phase]);
  const INP={background:"rgba(255,255,255,0.06)",border:"none",borderBottom:"1px solid rgba(255,255,255,0.15)",color:"#ffffff",padding:"10px 0",fontSize:13,fontFamily:"'Courier Prime',monospace",outline:"none",width:"100%",boxSizing:"border-box"};
  const LBL={fontSize:8,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.16em",marginBottom:6,fontFamily:"'Courier Prime',monospace",fontWeight:700};

  return (
    <div style={{position:"fixed",inset:0,background:T.ink,zIndex:400,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto"}}>

      {/* full-bleed dark UI - no modal box, it IS the screen */}
      <div style={{padding:"16px 20px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <div>
          <div style={{fontFamily:"'Rubik Dirt',sans-serif",fontSize:9,color:T.yellow,letterSpacing:"0.1em",marginBottom:1}}>VYUU</div>
          <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:14,color:"#ffffff",letterSpacing:"0.1em"}}>SCAN TO CLOSET</div>
        </div>
        <button style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.5)",cursor:"pointer",padding:"6px 12px",fontFamily:"'Courier Prime',monospace",fontSize:9,letterSpacing:"0.1em"}} onClick={()=>{stopCam();onClose();}}>CLOSE</button>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",overflowY:"auto"}}>

        {/* -- IDLE -- */}
        {phase==="idle"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",padding:"0 0 24px"}}>
            {/* hero text */}
            <div style={{padding:"32px 20px 28px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:36,color:"#ffffff",lineHeight:.9,letterSpacing:"-0.02em",marginBottom:16}}>
                POINT.<br/>SHOOT.<br/>LOGGED<span style={{color:T.yellow}}>.</span>
              </div>
              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:"0.1em",lineHeight:1.8}}>
                AI scans your piece and adds it to<br/>your digital wardrobe instantly.
              </div>
            </div>
            {camErr&&(
              <div style={{margin:"16px 20px 0",padding:"10px 14px",background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.3)",fontFamily:"'Courier Prime',monospace",fontSize:10,color:"rgba(255,100,100,0.9)"}}>
                Camera denied. Use upload below.
              </div>
            )}
            {/* action buttons */}
            <div style={{padding:"24px 20px 0",display:"flex",flexDirection:"column",gap:12}}>
              <button onClick={startCam} style={{background:T.yellow,border:"none",color:T.ink,padding:"18px 20px",cursor:"pointer",fontFamily:"'Archivo Black',sans-serif",fontSize:13,letterSpacing:"0.1em",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"opacity .1s"}}
                onMouseEnter={e=>e.currentTarget.style.opacity=".88"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                <span>USE CAMERA</span>
                <span style={{fontSize:20}}>⊙</span>
              </button>
              <button onClick={()=>fileRef.current.click()} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.7)",padding:"16px 20px",cursor:"pointer",fontFamily:"'Archivo Black',sans-serif",fontSize:12,letterSpacing:"0.1em",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"border-color .1s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.5)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"}>
                <span>UPLOAD PHOTO</span>
                <span style={{fontSize:18}}>^</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
            {/* process steps */}
            <div style={{padding:"28px 20px 0",display:"flex",flexDirection:"column",gap:12}}>
              {[["01","PHOTOGRAPH","Point at any clothing item"],["02","AI READS IT","Brand, category, color - detected"],["03","LOGGED","Instantly added to your closet"]].map(([n,h,s])=>(
                <div key={n} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"10px 0",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                  <span style={{fontFamily:"'Rubik Dirt',sans-serif",fontSize:10,color:T.yellow,flexShrink:0,paddingTop:1}}>{n}</span>
                  <div>
                    <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:11,color:"rgba(255,255,255,0.9)",marginBottom:2,letterSpacing:"0.04em"}}>{h}</div>
                    <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:"rgba(255,255,255,0.35)"}}>{s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -- CAMERA -- */}
        {phase==="camera"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column"}}>
            <div style={{position:"relative",flex:1,background:"#000",minHeight:320}}>
              <video ref={vid} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} playsInline muted/>
              {/* targeting reticle */}
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                <div style={{position:"relative",width:200,height:200}}>
                  {/* corner brackets */}
                  {[["tl","top left"],["tr","top right"],["bl","bottom left"],["br","bottom right"]].map(([pos])=>(
                    <div key={pos} style={{position:"absolute",...(pos.includes("t")?{top:0}:{bottom:0}),...(pos.includes("l")?{left:0}:{right:0}),width:24,height:24,
                      borderTop:pos.includes("t")?`2px solid ${T.yellow}`:"none",
                      borderBottom:pos.includes("b")?`2px solid ${T.yellow}`:"none",
                      borderLeft:pos.includes("l")?`2px solid ${T.yellow}`:"none",
                      borderRight:pos.includes("r")?`2px solid ${T.yellow}`:"none",
                    }}/>
                  ))}
                  {/* center dot */}
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:6,height:6,background:T.yellow,borderRadius:"50%",animation:"blink 1.5s ease-in-out infinite"}}/>
                </div>
              </div>
              <div style={{position:"absolute",bottom:16,left:0,right:0,textAlign:"center",fontFamily:"'Courier Prime',monospace",fontSize:9,color:"rgba(255,255,255,0.5)",letterSpacing:"0.2em"}}>
                FRAME YOUR PIECE
              </div>
            </div>
            <div style={{padding:"16px 20px",display:"flex",gap:10}}>
              <button onClick={capture} style={{flex:1,background:T.yellow,border:"none",color:T.ink,padding:"16px",fontFamily:"'Archivo Black',sans-serif",fontSize:12,letterSpacing:"0.1em",cursor:"pointer"}}>CAPTURE</button>
              <button onClick={()=>{stopCam();setPhase("idle");}} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.5)",padding:"16px 18px",cursor:"pointer",fontFamily:"'Courier Prime',monospace",fontSize:9,letterSpacing:"0.1em"}}>{"←"}</button>
            </div>
          </div>
        )}

        {/* -- PREVIEW -- */}
        {phase==="preview"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column"}}>
            <div style={{flex:1,position:"relative",minHeight:280,background:"#000"}}>
              <img src={cap} alt="" style={{width:"100%",height:"100%",objectFit:"contain",display:"block"}}/>
              <div style={{position:"absolute",top:12,left:12,fontFamily:"'Courier Prime',monospace",fontSize:8,color:"rgba(255,255,255,0.4)",letterSpacing:"0.16em",background:"rgba(0,0,0,0.5)",padding:"4px 8px"}}>PREVIEW</div>
            </div>
            <div style={{padding:"16px 20px",display:"flex",gap:10}}>
              <button onClick={analyze} style={{flex:1,background:T.yellow,border:"none",color:T.ink,padding:"16px",fontFamily:"'Archivo Black',sans-serif",fontSize:12,letterSpacing:"0.1em",cursor:"pointer"}}>
                ANALYZE WITH AI {"→"}
              </button>
              <button onClick={()=>{setCap(null);setPhase("idle");}} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.5)",padding:"16px 14px",cursor:"pointer",fontFamily:"'Courier Prime',monospace",fontSize:9}}>RETAKE</button>
            </div>
          </div>
        )}

        {/* -- SCANNING -- */}
        {phase==="scanning"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",gap:0}}>
            {/* photo behind */}
            <div style={{position:"relative",width:"100%",maxWidth:320,marginBottom:32}}>
              <img src={cap} alt="" style={{width:"100%",aspectRatio:"4/3",objectFit:"cover",filter:"grayscale(1) brightness(0.3)",display:"block"}}/>
              {/* scan line animation */}
              <div style={{position:"absolute",inset:0,overflow:"hidden"}}>
                <div style={{position:"absolute",left:0,right:0,height:2,background:`linear-gradient(90deg, transparent, ${T.yellow}, transparent)`,animation:"scanline 1.8s linear infinite"}}/>
              </div>
              <div style={{position:"absolute",inset:0,border:`1px solid rgba(255,229,0,0.3)`}}/>
            </div>
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:22,color:"#ffffff",letterSpacing:"0.08em",marginBottom:8}}>
              READING{"...".slice(0,dots+1)}
            </div>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.2em"}}>
              AI IS IDENTIFYING YOUR PIECE
            </div>
          </div>
        )}

        {/* -- DONE -- */}
        {phase==="done"&&res&&(
          <div style={{flex:1,display:"flex",flexDirection:"column"}}>
            {/* result header */}
            <div style={{padding:"20px 20px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.yellow,letterSpacing:"0.2em",marginBottom:8}}>ITEM IDENTIFIED</div>
              <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:26,color:"#ffffff",letterSpacing:"0.01em",lineHeight:.95,marginBottom:6}}>{res.name}</div>
              {res.brand&&<div style={{fontFamily:"'Courier Prime',monospace",fontSize:11,color:"rgba(255,255,255,0.4)"}}>{res.brand}</div>}
            </div>
            {/* photo + details */}
            <div style={{display:"flex",gap:0,borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
              <img src={cap} alt="" style={{width:120,height:140,objectFit:"cover",flexShrink:0,filter:"contrast(1.05) brightness(0.9)"}}/>
              <div style={{flex:1,padding:"16px 16px",display:"flex",flexDirection:"column",gap:10}}>
                {[["CATEGORY",res.category],["MATERIAL",res.material||"-"],["SIZE",res.size||"-"]].map(([k,v])=>(
                  <div key={k}>
                    <div style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:"rgba(255,255,255,0.3)",letterSpacing:"0.16em",marginBottom:2}}>{k}</div>
                    <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:11,color:"rgba(255,255,255,0.85)"}}>{v}</div>
                  </div>
                ))}
                {res.color&&(
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:20,height:20,background:res.color,border:"1px solid rgba(255,255,255,0.2)",flexShrink:0}}/>
                    <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:"rgba(255,255,255,0.4)"}}>{res.color}</span>
                  </div>
                )}
              </div>
            </div>
            {res.notes&&<div style={{padding:"12px 20px",fontFamily:"'Courier Prime',monospace",fontSize:10,color:"rgba(255,255,255,0.35)",fontStyle:"italic",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>{res.notes}</div>}
            <div style={{padding:"16px 20px",display:"flex",gap:10,marginTop:"auto"}}>
              <button onClick={confirm} style={{flex:1,background:T.yellow,border:"none",color:T.ink,padding:"16px",fontFamily:"'Archivo Black',sans-serif",fontSize:12,letterSpacing:"0.1em",cursor:"pointer"}}>
                ADD TO CLOSET v
              </button>
              <button onClick={()=>{setCap(null);setRes(null);setPhase("idle");}} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.5)",padding:"16px 14px",cursor:"pointer",fontFamily:"'Courier Prime',monospace",fontSize:9}}>RETAKE</button>
            </div>
          </div>
        )}

        {/* -- MANUAL -- */}
        {phase==="manual"&&(
          <div style={{flex:1,padding:"20px",display:"flex",flexDirection:"column",gap:16}}>
            <img src={cap} alt="" style={{width:"100%",maxHeight:180,objectFit:"contain",filter:"brightness(0.6)",border:"1px solid rgba(255,255,255,0.1)"}}/>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
              AI COULDN'T READ IT - FILL IN BELOW
            </div>
            {[["Item Name","name"],["Brand","brand"],["Size","size"]].map(([l,k])=>(
              <div key={k}>
                <div style={LBL}>{l}</div>
                <input style={INP} onChange={e=>setRes(r=>({...(r||{}),name:k==="name"?e.target.value:(r||{}).name||"",brand:k==="brand"?e.target.value:(r||{}).brand||"",size:k==="size"?e.target.value:(r||{}).size||"",category:"Tops",color:"#1a1a1a",material:"",notes:""}))}/>
              </div>
            ))}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button onClick={()=>{if(res?.name)setPhase("done");}} style={{flex:1,background:T.yellow,border:"none",color:T.ink,padding:"15px",fontFamily:"'Archivo Black',sans-serif",fontSize:12,letterSpacing:"0.1em",cursor:"pointer"}}>CONTINUE {"→"}</button>
              <button onClick={()=>{setCap(null);setRes(null);setPhase("idle");}} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.5)",padding:"15px 14px",cursor:"pointer",fontFamily:"'Courier Prime',monospace",fontSize:9}}>RETAKE</button>
            </div>
          </div>
        )}

      </div>
      <canvas ref={can} style={{display:"none"}}/>
    </div>
  );
}



/* --- COST PER WEAR WIDGET --- */

function CostPerWear({ item, compact=false }) {
  const cpw = item.pricePaid && item.wears > 0 ? (item.pricePaid / item.wears).toFixed(2) : null;
  const progress = item.pricePaid ? Math.min(100, Math.round((item.wears / (item.pricePaid / 5)) * 100)) : 0;
  if (!item.pricePaid) return null;
  if (compact) return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>CPW</span>
      <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:11,color:cpw&&parseFloat(cpw)<20?T.red:T.ink}}>${cpw||"-"}</span>
    </div>
  );
  return (
    <div style={{background:T.wash,border:`1px solid ${T.grey1}`,padding:"12px 14px",marginBottom:0}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
        <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:9,color:T.ink,letterSpacing:"0.12em"}}>COST PER WEAR</span>
        <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:22,color:cpw&&parseFloat(cpw)<20?T.red:T.ink}}>${cpw||"-"}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:T.grey3,fontFamily:"'Courier Prime',monospace",marginBottom:6}}>
        <span>Paid ${item.pricePaid} . {item.wears} wears</span>
        <span>{progress}% earned back</span>
      </div>
      <div style={{height:3,background:T.grey1,position:"relative"}}>
        <div style={{position:"absolute",left:0,top:0,height:"100%",width:progress+"%",background:progress>=100?T.red:T.ink,transition:"width .4s"}}/>
      </div>
      {cpw&&parseFloat(cpw)<10&&<div style={{marginTop:8,fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.red,letterSpacing:"0.08em"}}>v UNDER $10/WEAR - THIS PIECE IS PULLING ITS WEIGHT.</div>}
    </div>
  );
}

/* --- PRICE HISTORY SPARKLINE --- */
function PriceSparkline({ history }) {
  if (!history || history.length < 2) return null;
  const prices = history.map(h=>h.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const W = 200, H = 48;
  const pts = history.map((h,i)=>{
    const x = (i/(history.length-1))*W;
    const y = H - ((h.price-min)/range)*(H-8) - 4;
    return {x,y,price:h.price,date:h.date};
  });
  const path = pts.map((p,i)=>(i===0?"M":"L")+p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ");
  const trend = prices[prices.length-1] > prices[0];
  return (
    <div style={{background:T.wash,border:`1px solid ${T.grey1}`,padding:"12px 14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
        <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:9,color:T.ink,letterSpacing:"0.12em"}}>PRICE HISTORY</span>
        <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:trend?T.red:"#2D6A4F",letterSpacing:"0.08em"}}>{trend?"^ RISING":"v DROPPING"}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
        <path d={path} fill="none" stroke={T.ink} strokeWidth="1.5"/>
        {pts.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill={i===pts.length-1?T.red:T.paper} stroke={T.ink} strokeWidth="1.5"/>
            <text x={p.x} y={H+12} textAnchor="middle" fontSize="7" fill={T.grey3} fontFamily="'Courier Prime',monospace">{p.date}</text>
            {(i===0||i===pts.length-1)&&<text x={p.x} y={p.y-6} textAnchor="middle" fontSize="7" fill={T.ink} fontFamily="'Archivo Black',sans-serif">${p.price}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

/* --- OOTD VOTE BUTTON --- */
function OOTDVote({ post, setPosts }) {
  const voted = (post.votedBy||[]).includes("me");
  const vote = (e) => {
    e.stopPropagation();
    setPosts(ps=>ps.map(p=>p.id===post.id
      ? {...p, votes:(p.votes||0)+(voted?-1:1), votedBy:voted?(p.votedBy||[]).filter(u=>u!=="me"):[...(p.votedBy||[]),"me"]}
      : p
    ));
  };
  return (
    <button onClick={vote} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:voted?T.yellow:"none",border:`2px solid ${voted?T.yellow:T.grey1}`,padding:"6px 10px",cursor:"pointer",minWidth:52,transition:voted?"transform .08s cubic-bezier(.3,0,.6,1), box-shadow .08s":"transform .18s cubic-bezier(.2,.8,.4,1.2), box-shadow .18s",transform:"translate(0,0)",boxShadow:voted?`3px 3px 0 ${T.ink}`:`2px 2px 0 ${T.grey1}`,WebkitTapHighlightColor:"transparent",position:"relative",overflow:"hidden"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translate(-1px,-1px)";e.currentTarget.style.boxShadow=voted?`4px 4px 0 ${T.ink}`:`3px 3px 0 ${T.grey2}`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translate(0,0)";e.currentTarget.style.boxShadow=voted?`3px 3px 0 ${T.ink}`:`2px 2px 0 ${T.grey1}`;}}
      onMouseDown={e=>{e.currentTarget.style.transform="translate(2px,2px)";e.currentTarget.style.boxShadow="none";}}
      onMouseUp={e=>{e.currentTarget.style.transform="translate(-1px,-1px)";e.currentTarget.style.boxShadow=voted?`4px 4px 0 ${T.ink}`:`3px 3px 0 ${T.grey2}`;}}>
      <span style={{fontSize:14,lineHeight:1,transition:"transform .15s cubic-bezier(.2,.8,.4,1.4)",transform:voted?"scale(1.3) rotate(-5deg)":"scale(1)"}}>{voted?"*":"*"}</span>
      <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:8,color:voted?T.ink:T.grey3,letterSpacing:"0.06em"}}>{post.votes||0}</span>
      <span style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:voted?T.ink:T.grey3,letterSpacing:"0.1em"}}>OOTD</span>
    </button>
  );
}

/* --- WHO WORE IT BETTER CARD --- */
function WhoWoreItBetter({ posts, setPosts, onUser }) {
  // Find pairs of posts from different users with same category
  const pairs = [];
  const seen = new Set();
  for (let i = 0; i < posts.length; i++) {
    for (let j = i+1; j < posts.length; j++) {
      const key = [posts[i].id,posts[j].id].sort().join("-");
      if (!seen.has(key) && posts[i].cat === posts[j].cat && posts[i].user !== posts[j].user) {
        pairs.push([posts[i],posts[j]]);
        seen.add(key);
        if (pairs.length >= 1) break;
      }
    }
    if (pairs.length >= 1) break;
  }
  if (!pairs.length) return null;
  const [a,b] = pairs[0];
  const uA = USERS[a.user], uB = USERS[b.user];
  const totalVotes = (a.votes||0)+(b.votes||0);
  const pctA = totalVotes ? Math.round(((a.votes||0)/totalVotes)*100) : 50;
  return (
    <div style={{borderBottom:`3px solid ${T.ink}`,background:T.paper}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:`2px solid ${T.ink}`,background:T.ink}}>
        <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.yellow,letterSpacing:"0.16em"}}>WHO WORE IT BETTER?</span>
        <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.12em"}}>{a.cat.toUpperCase()}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
        {[[a,uA,pctA],[b,uB,100-pctA]].map(([post,user,pct],side)=>(
          <div key={post.id} style={{borderRight:side===0?`2px solid ${T.ink}`:"none",position:"relative"}}>
            <ItemPhoto img={post.img} category={post.cat} brand="" height={200}/>
            <div style={{padding:"8px 10px",borderTop:`1px solid ${T.grey1}`}}>
              <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.ink,cursor:"pointer",marginBottom:4}} onClick={()=>onUser(post.user)}>{user.name}</div>
              <div style={{height:3,background:T.grey1,marginBottom:4}}>
                <div style={{height:"100%",width:pct+"%",background:T.red,transition:"width .5s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:13,color:T.ink}}>{pct}%</span>
                <OOTDVote post={post} setPosts={setPosts}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- FORGOTTEN PIECES PANEL --- */
function ForgottenPieces({ wardrobe, onItem, onList }) {
  const forgotten = wardrobe.filter(item =>
    item.lastWorn && !["Today","1d ago","2d ago","3d ago","4d ago","5d ago","6d ago","1w ago"].includes(item.lastWorn)
    && item.lastWorn !== "Never" || (item.wears===0)
  );
  if (!forgotten.length) return null;
  return (
    <div style={{border:`2px solid ${T.ink}`,margin:"0 0 0 0",background:T.paper}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:`2px solid ${T.ink}`,background:T.wash}}>
        <div>
          <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.ink,letterSpacing:"0.12em"}}>FORGOTTEN PIECES</div>
          <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,marginTop:2}}>Haven't worn in 90+ days - or never.</div>
        </div>
        <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:18,color:T.red}}>{forgotten.length}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
        {forgotten.map((item,i)=>(
          <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderBottom:i<forgotten.length-1?`1px solid ${T.grey1}`:"none",cursor:"pointer"}} onClick={()=>onItem(item)}>
            <ClothingShape category={item.cat} size={36}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.ink}}>{item.name}</div>
              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>{item.brand||item.cat} . {item.wears===0?"never worn":item.lastWorn}</div>
              {item.pricePaid&&<div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey2,marginTop:1}}>Paid ${item.pricePaid} . {item.wears} wears</div>}
            </div>
            <button onClick={e=>{e.stopPropagation();onList(item);}} style={{background:"none",border:`1px solid ${T.grey2}`,color:T.grey3,padding:"3px 8px",cursor:"pointer",fontFamily:"'Courier Prime',monospace",fontSize:8,letterSpacing:"0.08em",whiteSpace:"nowrap",flexShrink:0}}>LIST IT {"→"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- OOTD LEADERBOARD --- */
function OOTDLeaderboard({ posts, setPosts, onUser }) {
  const sorted = [...posts].sort((a,b)=>(b.votes||0)-(a.votes||0)).slice(0,3);
  return (
    <div style={{borderBottom:`3px solid ${T.ink}`}}>
      <div style={{padding:"10px 14px",borderBottom:`2px solid ${T.ink}`,background:T.ink,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.yellow,letterSpacing:"0.16em"}}>TODAY'S OOTD BOARD</span>
        <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>VOTE * FOR YOUR PICK</span>
      </div>
      {sorted.map((post,i)=>{
        const user=USERS[post.user];
        const medals=["01","02","03"];
        return (
          <div key={post.id} style={{display:"flex",alignItems:"center",gap:0,borderBottom:i<2?`1px solid ${T.grey1}`:"none"}}>
            <div style={{width:40,flexShrink:0,background:i===0?T.yellow:"transparent",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:"stretch",borderRight:`2px solid ${T.ink}`}}>
              <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:13,color:i===0?T.ink:T.grey2}}>{medals[i]}</span>
            </div>
            <div style={{width:64,flexShrink:0,borderRight:`1px solid ${T.grey1}`}}>
              <ItemPhoto img={post.img} category={post.cat} brand="" height={64}/>
            </div>
            <div style={{flex:1,padding:"8px 12px",cursor:"pointer"}} onClick={()=>onUser(post.user)}>
              <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.ink}}>{user.name}</div>
              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,marginTop:2}}>{post.caption.slice(0,48)}...</div>
            </div>
            <div style={{padding:"0 12px",flexShrink:0}}>
              <OOTDVote post={post} setPosts={setPosts}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TagPage({ tag, posts, onClose, onUser, onLike, setPosts, onShare, onNotify }) {
  var tp=posts.filter(p=>(p.tags||[]).includes(tag));
  return (
    <div style={{position:"fixed",inset:0,background:T.paper,zIndex:300,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto"}}>
      <div style={{background:T.ink,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:T.grey2,cursor:"pointer",fontFamily:"'Courier Prime',monospace",fontSize:14,lineHeight:1,padding:0}}>{"←"}</button>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Rubik Dirt',sans-serif",fontSize:9,color:T.yellow}}>VYUU</div>
          <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:18,color:T.paper}}>{"#"}{tag}</div>
        </div>
        <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>{tp.length} posts</div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {tp.length===0
          ?<div style={{padding:"48px 20px",textAlign:"center"}}><div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:24,color:T.grey1}}>NO POSTS YET{"."}</div></div>
          :tp.map((p,i)=><ZinePost key={p.id} post={p} idx={i} onUser={onUser} onLike={onLike} setAllPosts={setPosts} setPosts={setPosts} onShare={onShare} onNotify={onNotify}/>)
        }
      </div>
    </div>
  );
}

function GlobalSearch({ posts, listings, onClose, onUser, onPost, onListing, setProfUid, setTab }) {
  const [q,setQ]=useState("");
  var results=[];
  if(q.trim().length>1){
    var ql=q.toLowerCase();
    // People
    Object.values(USERS).forEach(u=>{
      if((u.name+u.handle+u.bio).toLowerCase().includes(ql))
        results.push({type:"user",data:u,score:u.handle.toLowerCase().startsWith(ql)?3:1});
    });
    // Posts
    posts.filter(p=>(p.caption||"").toLowerCase().includes(ql)||(p.tags||[]).some(t=>t.includes(ql))).forEach(p=>{
      results.push({type:"post",data:p,score:2});
    });
    // Listings
    listings.filter(l=>(l.title+l.brand+l.desc).toLowerCase().includes(ql)).forEach(l=>{
      results.push({type:"listing",data:l,score:1});
    });
    results.sort((a,b)=>b.score-a.score);
  }
  return (
    <div style={{position:"fixed",inset:0,background:T.paper,zIndex:400,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto"}}>
      <div style={{background:T.ink,padding:"14px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:T.grey2,cursor:"pointer",fontSize:14,lineHeight:1,padding:0,fontFamily:"'Courier Prime',monospace"}}>{"←"}</button>
        <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="search people, posts, listings..." style={{flex:1,background:"none",border:"none",outline:"none",color:T.paper,fontSize:13,fontFamily:"'Courier Prime',monospace"}}/>
        {q&&<button onClick={()=>setQ("")} style={{background:"none",border:"none",color:T.grey3,cursor:"pointer",fontSize:16,lineHeight:1,padding:0}}>{"×"}</button>}
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {q.trim().length<2?(
          <div style={{padding:"40px 20px",textAlign:"center"}}>
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:22,color:T.grey1,lineHeight:.9,marginBottom:10}}>SEARCH<br/>VYUU{"."}</div>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey3}}>People, posts, and listings in one place.</div>
          </div>
        ):results.length===0?(
          <div style={{padding:"40px 20px",textAlign:"center"}}>
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:20,color:T.grey1}}>NO RESULTS.</div>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey3,marginTop:8}}>Try a different search.</div>
          </div>
        ):results.map((r,i)=>{
          if(r.type==="user") return (
            <button key={"u"+r.data.id} onClick={()=>{setProfUid(r.data.id);setTab("Profile");onClose();}} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"none",border:"none",borderBottom:"1px solid "+T.grey1,cursor:"pointer",textAlign:"left"}}>
              <UserAvatar name={r.data.name} size={40}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:12,color:T.ink}}>{r.data.name}</div>
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>@{r.data.handle}</div>
              </div>
              <span style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3,border:"1px solid "+T.grey1,padding:"2px 6px"}}>PERSON</span>
            </button>
          );
          if(r.type==="post") return (
            <div key={"p"+r.data.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:"1px solid "+T.grey1,cursor:"pointer"}} onClick={()=>onClose()}>
              <ItemPhoto img={r.data.img||null} category={r.data.cat} brand="" height={52} small/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3,marginBottom:2}}>@{USERS[r.data.user]?.handle}</div>
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:11,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.data.caption}</div>
              </div>
              <span style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3,border:"1px solid "+T.grey1,padding:"2px 6px",flexShrink:0}}>POST</span>
            </div>
          );
          if(r.type==="listing") return (
            <button key={"l"+r.data.id} onClick={()=>{onListing(r.data);onClose();}} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"none",border:"none",borderBottom:"1px solid "+T.grey1,cursor:"pointer",textAlign:"left"}}>
              <ItemPhoto img={r.data.img||null} category={r.data.cat} brand="" height={52} small/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:11,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.data.title}</div>
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>{r.data.brand} {"·"} ${r.data.price}</div>
              </div>
              <span style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3,border:"1px solid "+T.grey1,padding:"2px 6px",flexShrink:0}}>LISTING</span>
            </button>
          );
          return null;
        })}
      </div>
    </div>
  );
}

function StoriesBar({ posts, following, onUser }) {
  // Show story rings for followed users who posted today
  var storyUsers=Object.values(USERS).filter(u=>
    u.id!=="me"&&(following.includes(u.id)||true)&&
    posts.some(p=>p.user===u.id&&(p.time==="now"||p.time==="2h"||p.time==="5h"))
  ).slice(0,8);
  var myPost=posts.find(p=>p.user==="me"&&(p.time==="now"||p.time==="2h"));
  if(storyUsers.length===0&&!myPost) return null;
  return (
    <div style={{display:"flex",gap:0,overflowX:"auto",borderBottom:"2px solid "+T.ink,background:T.wash,padding:"10px 14px"}}>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0,cursor:"pointer"}}>
          <div style={{width:44,height:44,border:"2px dashed "+T.grey2,display:"flex",alignItems:"center",justifyContent:"center",background:T.paper}}>
            <span style={{fontSize:20,color:T.grey3,lineHeight:1}}>+</span>
          </div>
          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3,letterSpacing:"0.06em"}}>YOUR STORY</span>
        </div>
        {storyUsers.map(u=>(
          <div key={u.id} onClick={()=>onUser(u.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0,cursor:"pointer"}}>
            <div style={{width:44,height:44,border:"3px solid "+T.red,padding:2,background:T.paper}}>
              <UserAvatar name={u.name} size={34}/>
            </div>
            <span style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.ink,letterSpacing:"0.06em",maxWidth:48,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name.split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- FRIENDS LEADERBOARD --- */
function BundleCreator({ myListings, onBundle }) {
  const [sel,setSel]=useState([]);
  const [disc,setDisc]=useState(10);
  var toggle=id=>setSel(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  var total=sel.reduce((s,id)=>{var l=myListings.find(x=>x.id===id);return s+(l?l.price:0);},0);
  var bp=Math.round(total*(1-disc/100));
  if(myListings.length<2) return null;
  return (
    <div style={{border:"2px solid "+T.ink,margin:"12px 12px 0"}}>
      <div style={{background:T.ink,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:9,color:T.yellow,letterSpacing:"0.14em"}}>CREATE BUNDLE</span>
        <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>list items together at a discount</span>
      </div>
      <div style={{padding:"10px 12px"}}>
        {myListings.map(l=>(
          <button key={l.id} onClick={()=>toggle(l.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"8px 0",background:"none",border:"none",borderBottom:"1px solid "+T.grey1,cursor:"pointer",textAlign:"left"}}>
            <div style={{width:16,height:16,border:"2px solid "+(sel.includes(l.id)?T.ink:T.grey1),background:sel.includes(l.id)?T.ink:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {sel.includes(l.id)&&<span style={{color:T.paper,fontSize:9}}>{"v"}</span>}
            </div>
            <span style={{flex:1,fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.ink}}>{l.title}</span>
            <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:11,color:T.ink}}>${l.price}</span>
          </button>
        ))}
        {sel.length>=2&&(
          <div style={{marginTop:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>Discount</span>
              <div style={{display:"flex",gap:5}}>
                {[5,10,15,20].map(d=>(
                  <button key={d} onClick={()=>setDisc(d)} style={{background:disc===d?T.ink:"transparent",border:"1px solid "+(disc===d?T.ink:T.grey1),color:disc===d?T.paper:T.grey3,padding:"2px 8px",fontFamily:"'Courier Prime',monospace",fontSize:8,cursor:"pointer"}}>{d}%</button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
              <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>Bundle price</span>
              <div>
                <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:20,color:T.ink}}>${bp}</span>
                <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey2,textDecoration:"line-through",marginLeft:6}}>${total}</span>
              </div>
            </div>
            <button onClick={()=>onBundle(sel,bp,disc)} style={{width:"100%",background:T.ink,border:"none",color:T.paper,padding:"12px",fontFamily:"'Archivo Black',sans-serif",fontSize:10,letterSpacing:"0.1em",cursor:"pointer"}}>LIST BUNDLE {"→"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ThemeChallenge() {
  const cands=[
    {id:"c1",name:"WET PAVEMENT",desc:"Dark, moody, post-rain.",votes:47},
    {id:"c2",name:"FLEA MARKET FIND",desc:"Everything from a stall.",votes:31},
    {id:"c3",name:"SILENT LIBRARY",desc:"Minimal, academic, focused.",votes:52},
  ];
  const [voted,setVoted]=useState(null);
  var tot=cands.reduce((s,c)=>s+c.votes+(voted===c.id?1:0),0);
  return (
    <div style={{border:"2px solid "+T.ink,margin:"12px 12px 0"}}>
      <div style={{background:T.ink,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:9,color:T.yellow,letterSpacing:"0.14em"}}>NEXT THEME VOTE</div>
          <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,marginTop:1}}>community picks tomorrow's aesthetic</div>
        </div>
        <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>ends in 18h</div>
      </div>
      {cands.map(c=>{
        var v=c.votes+(voted===c.id?1:0);
        var pct=tot>0?Math.round((v/tot)*100):0;
        var mx=cands.reduce((m,x)=>Math.max(m,x.votes+(voted===x.id?1:0)),0);
        return (
          <div key={c.id} style={{borderBottom:"1px solid "+T.grey1,padding:"10px 12px"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:6}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:11,color:T.ink}}>{c.name}</span>
                  {v===mx&&voted&&<span style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.yellow,border:"1px solid "+T.yellow,padding:"1px 4px"}}>LEADING</span>}
                </div>
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>{c.desc}</div>
              </div>
              <button onClick={()=>{if(!voted)setVoted(c.id);}} style={{background:voted===c.id?T.ink:"transparent",border:"2px solid "+(voted===c.id?T.ink:T.grey1),color:voted===c.id?T.paper:T.grey3,padding:"4px 12px",fontFamily:"'Archivo Black',sans-serif",fontSize:8,cursor:voted?"default":"pointer",letterSpacing:"0.08em",flexShrink:0}}>{voted===c.id?"VOTED":"VOTE"}</button>
            </div>
            <div style={{height:3,background:T.grey1}}>
              <div style={{height:"100%",width:pct+"%",background:v===mx&&voted?T.yellow:T.ink,transition:"width .4s ease"}}/>
            </div>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,marginTop:3}}>{pct}% {"·"} {v} votes</div>
          </div>
        );
      })}
    </div>
  );
}

function FriendsLeaderboard({ posts, following, onUser, onDiscover }) {
  if(!following||following.length===0){
    return (
      <div style={{borderBottom:"3px solid "+T.ink,padding:"20px 14px",background:T.wash,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.ink,letterSpacing:"0.16em"}}>FRIENDS BOARD</div>
        <div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey3,lineHeight:1.7}}>Follow people to see how your crew ranks.</div>
        <button onClick={onDiscover} style={{background:T.ink,border:"none",color:T.paper,padding:"9px 16px",fontFamily:"'Archivo Black',sans-serif",fontSize:9,letterSpacing:"0.1em",cursor:"pointer",alignSelf:"flex-start"}}>FIND PEOPLE {"→"}</button>
      </div>
    );
  }

  // Build ranked list: for each person you follow, sum their post likes
  const scores=following.map(uid=>{
    const user=USERS[uid];
    if(!user) return null;
    const userPosts=posts.filter(p=>p.user===uid);
    const totalLikes=userPosts.reduce((s,p)=>s+(p.likes||0),0);
    const totalVotes=userPosts.reduce((s,p)=>s+(p.votes||0),0);
    const bestPost=userPosts.sort((a,b)=>(b.likes||0)-(a.likes||0))[0]||null;
    return {uid,user,totalLikes,totalVotes,postCount:userPosts.length,bestPost};
  }).filter(Boolean).sort((a,b)=>b.totalLikes-a.totalLikes);

  // Add "me" to the board too
  const myPosts=posts.filter(p=>p.user==="me");
  const myScore={
    uid:"me",user:USERS.me,
    totalLikes:myPosts.reduce((s,p)=>s+(p.likes||0),0),
    totalVotes:myPosts.reduce((s,p)=>s+(p.votes||0),0),
    postCount:myPosts.length,
    bestPost:myPosts.sort((a,b)=>(b.likes||0)-(a.likes||0))[0]||null,
    isMe:true
  };
  const allScores=[myScore,...scores].sort((a,b)=>b.totalLikes-a.totalLikes);
  const myRank=allScores.findIndex(x=>x.uid==="me")+1;

  return (
    <div style={{borderBottom:"3px solid "+T.ink}}>
      {/* header */}
      <div style={{padding:"10px 14px",borderBottom:"2px solid "+T.ink,background:T.ink,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.yellow,letterSpacing:"0.16em"}}>FRIENDS BOARD</span>
          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,marginLeft:10}}>your circle . ranked by likes</span>
        </div>
        <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>{allScores.length} PEOPLE</span>
      </div>
      {/* rows */}
      {allScores.slice(0,5).map((entry,i)=>{
        const isMe=entry.isMe;
        const medal=["01","02","03","04","05"][i];
        const isTop=i===0;
        return (
          <div key={entry.uid} style={{display:"flex",alignItems:"center",gap:0,borderBottom:i<allScores.slice(0,5).length-1?"1px solid "+T.grey1:"none",background:isMe?"rgba(255,229,0,0.06)":"transparent"}}>
            {/* rank */}
            <div style={{width:40,flexShrink:0,background:isTop?T.yellow:isMe?T.wash:"transparent",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:"stretch",borderRight:"2px solid "+T.ink}}>
              <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:13,color:isTop?T.ink:T.grey2}}>{medal}</span>
            </div>
            {/* avatar + photo */}
            <div style={{width:56,flexShrink:0,borderRight:"1px solid "+T.grey1}}>
              {entry.bestPost
                ? <ItemPhoto img={entry.bestPost.img} category={entry.bestPost.cat} brand="" height={56}/>
                : <div style={{height:56,background:T.wash,display:"flex",alignItems:"center",justifyContent:"center"}}><UserAvatar name={entry.user.name} size={32}/></div>
              }
            </div>
            {/* info */}
            <div style={{flex:1,padding:"8px 10px",cursor:isMe?"default":"pointer",minWidth:0}} onClick={()=>!isMe&&onUser(entry.uid)}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{isMe?"YOU":entry.user.name}</div>
                {isMe&&<span style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.yellow,border:"1px solid "+T.yellow,padding:"1px 4px",flexShrink:0}}>YOU</span>}
              </div>
              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,marginTop:2}}>@{entry.user.handle}</div>
              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey2,marginTop:3}}>
                {entry.totalLikes.toLocaleString()} likes {"·"} {entry.postCount} post{entry.postCount!==1?"s":""}
              </div>
            </div>
            {/* score */}
            <div style={{padding:"0 12px",flexShrink:0,textAlign:"center"}}>
              <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:16,color:isTop?T.red:T.ink}}>{entry.totalLikes>999?(entry.totalLikes/1000).toFixed(1)+"k":entry.totalLikes}</div>
              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3,letterSpacing:"0.1em"}}>LIKES</div>
            </div>
          </div>
        );
      })}
      {/* your rank if outside top 5 */}
      {myRank>5&&(
        <div style={{padding:"8px 14px",borderTop:"1px dashed "+T.grey1,display:"flex",alignItems:"center",gap:10,background:"rgba(255,229,0,0.04)"}}>
          <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.grey2}}>#{myRank}</span>
          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>you . {myScore.totalLikes} likes</span>
          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,marginLeft:"auto"}}>keep posting</span>
        </div>
      )}
    </div>
  );
}

/* --- ZINE SUBMISSION PANEL --- */
function ZineSubmission({ onSubmit }) {
  const [open,setOpen]=useState(false);
  const [title,setTitle]=useState("");
  const [body,setBody]=useState("");
  const [img,setImg]=useState(null);
  const [submitted,setSubmitted]=useState(false);
  const submit=()=>{
    if(!title.trim()||!body.trim())return;
    setSubmitted(true);
    setTimeout(()=>{setOpen(false);setSubmitted(false);setTitle("");setBody("");setImg(null);},2200);
  };
  return (
    <div style={{border:`2px solid ${T.ink}`,margin:"0",background:T.wash}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",cursor:"pointer",borderBottom:open?`2px solid ${T.ink}`:"none"}} onClick={()=>setOpen(o=>!o)}>
        <div>
          <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.ink,letterSpacing:"0.12em"}}>SUBMIT TO THE ZINE</div>
          <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,marginTop:2}}>Editorial pages. Community picks get published.</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{background:T.red,padding:"2px 8px"}}><span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:7,color:T.paper,letterSpacing:"0.12em"}}>OPEN</span></div>
          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:12,color:T.ink,transform:open?"rotate(180deg)":"none",display:"inline-block",transition:"transform .15s"}}>v</span>
        </div>
      </div>
      {open&&(
        <div style={{padding:"14px"}}>
          {submitted ? (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:18,color:T.red,marginBottom:8}}>SUBMITTED.</div>
              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:11,color:T.grey3}}>We'll review your page. Community picks go live in the next issue.</div>
            </div>
          ) : (
            <>
              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3,letterSpacing:"0.12em",marginBottom:10,borderLeft:`3px solid ${T.red}`,paddingLeft:8}}>Your submission becomes a full editorial page in the VYUU zine. Write it like a piece - not a caption.</div>
              <div style={{marginBottom:10}}>
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.12em",marginBottom:4}}>PAGE HEADLINE</div>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="The piece that changed how I dress." style={{width:"100%",background:T.paper,border:"none",borderBottom:`2px solid ${T.ink}`,color:T.ink,padding:"8px 0",fontSize:13,fontFamily:"'Archivo Black',sans-serif",outline:"none",letterSpacing:"-0.01em"}}/>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.12em",marginBottom:4}}>EDITORIAL BODY</div>
                <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Write like the reader doesn't know you yet. What's the story? The context? The feeling?" rows={4} style={{width:"100%",background:T.paper,border:`1px solid ${T.grey1}`,borderLeft:`3px solid ${T.ink}`,color:T.ink,padding:"10px 12px",fontSize:11,fontFamily:"'Courier Prime',monospace",outline:"none",resize:"vertical",lineHeight:1.7}}/>
              </div>
              <ImageUpload value={img} onChange={setImg} height={120} label="ATTACH EDITORIAL PHOTO"/>
              <div style={{marginTop:10,display:"flex",gap:8,justifyContent:"flex-end"}}>
                <Btn variant="ghost" onClick={()=>setOpen(false)} style={{padding:"7px 14px",fontSize:8}}>CANCEL</Btn>
                <Btn onClick={submit} style={{padding:"7px 18px",fontSize:8}} disabled={!title.trim()||!body.trim()}>SUBMIT PAGE {"→"}</Btn>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* --- TASTE PROFILE WIDGET --- */
function TasteProfile({ posts, wardrobe }) {
  // Derive taste from liked posts + wardrobe brands/cats
  const catCounts = {};
  const brandCounts = {};
  posts.filter(p=>p.likedBy?.includes("me")).forEach(p=>{
    catCounts[p.cat]=(catCounts[p.cat]||0)+3;
    if(p.tags) p.tags.forEach(t=>{catCounts[t]=(catCounts[t]||0)+1;});
  });
  wardrobe.forEach(item=>{
    catCounts[item.cat]=(catCounts[item.cat]||0)+1;
    if(item.brand) brandCounts[item.brand]=(brandCounts[item.brand]||0)+1;
  });
  const topCats = Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const topBrands = Object.entries(brandCounts).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const total = topCats.reduce((s,[,v])=>s+v,0)||1;
  const profiles = ["MINIMALIST","ARCHIVE HEAD","GORPCORE","STREETWEAR","TAILORING"];
  const profile = profiles[Math.floor(Date.now()/86400000/7)%profiles.length];
  return (
    <div style={{border:`2px solid ${T.ink}`,background:T.paper}}>
      <div style={{padding:"10px 14px",borderBottom:`2px solid ${T.ink}`,background:T.ink,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.yellow,letterSpacing:"0.14em"}}>YOUR TASTE PROFILE</span>
        <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>UPDATES AS YOU ENGAGE</span>
      </div>
      <div style={{padding:"14px"}}>
        <div style={{marginBottom:12}}>
          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.12em"}}>CURRENT PROFILE TYPE</span>
          <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:20,color:T.ink,letterSpacing:"-0.01em",marginTop:4}}>{profile}</div>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.12em",marginBottom:8}}>CATEGORY BREAKDOWN</div>
          {topCats.map(([cat,count])=>(
            <div key={cat} style={{marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.ink}}>{cat}</span>
                <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>{Math.round((count/total)*100)}%</span>
              </div>
              <div style={{height:2,background:T.grey1}}>
                <div style={{height:"100%",width:Math.round((count/total)*100)+"%",background:T.ink}}/>
              </div>
            </div>
          ))}
        </div>
        {topBrands.length>0&&(
          <div>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.12em",marginBottom:6}}>YOUR BRANDS</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {topBrands.map(([b])=><span key={b} style={{fontFamily:"'Courier Prime',monospace",fontSize:9,border:`1px solid ${T.ink}`,padding:"2px 8px",color:T.ink}}>{b}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WardrobeStats({ wardrobe }) {
  if(wardrobe.length===0) return null;
  const totalPaid=wardrobe.reduce((s,i)=>s+(parseFloat(i.pricePaid)||0),0);
  const totalWears=wardrobe.reduce((s,i)=>s+(i.wears||0),0);
  const avgCPW=totalPaid>0&&totalWears>0?(totalPaid/totalWears).toFixed(2):null;
  const deadstock=wardrobe.filter(i=>i.wears===0).length;
  const brands={};
  wardrobe.forEach(i=>{ if(i.brand) brands[i.brand]=(brands[i.brand]||0)+1; });
  const topBrand=Object.entries(brands).sort((a,b)=>b[1]-a[1])[0];
  const cats={};
  wardrobe.forEach(i=>{ cats[i.cat]=(cats[i.cat]||0)+1; });
  const topCat=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
  const mostWorn=wardrobe.reduce((a,b)=>b.wears>a.wears?b:a,wardrobe[0]);
  const stats=[
    ["TOTAL VALUE","$"+totalPaid.toFixed(0),"what you've invested"],
    ["TOTAL WEARS",totalWears,"times you've reached in"],
    ["AVG COST/WEAR",avgCPW?"$"+avgCPW:"--","your efficiency score"],
    ["UNWORN",deadstock+" pcs","sitting in the dark"],
    ["TOP BRAND",topBrand?topBrand[0]:"--","most in your closet"],
    ["MOST WORN",mostWorn?mostWorn.name.split(" ").slice(0,2).join(" "):"--","your true favourite"],
  ];
  const deadPct=wardrobe.length>0?Math.round((deadstock/wardrobe.length)*100):0;
  return (
    <div style={{padding:"0 0 20px"}}>
      <div style={{padding:"10px 14px 8px",borderBottom:"1px solid "+T.grey1}}>
        <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.14em"}}>CLOSET ANALYTICS</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
        {stats.map(([label,val,sub],i)=>(
          <div key={label} style={{padding:"14px 14px",borderBottom:"1px solid "+T.grey1,borderRight:i%2===0?"1px solid "+T.grey1:"none"}}>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:18,color:T.ink,lineHeight:1,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val}</div>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{margin:"12px 14px 0",border:"2px solid "+T.ink,padding:"12px"}}>
        <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.12em",marginBottom:8}}>DEADSTOCK RATIO</div>
        <div style={{height:6,background:T.grey1,marginBottom:6}}>
          <div style={{height:"100%",width:deadPct+"%",background:deadPct>50?T.red:T.ink,transition:"width .4s ease"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.ink}}>{deadPct}% never worn</span>
          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>{wardrobe.length-deadstock} pieces in rotation</span>
        </div>
        {deadPct>40&&<div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.red,marginTop:6,fontStyle:"italic"}}>More than half your closet is sitting. Time to wear it or sell it.</div>}
      </div>
      {topCat&&(
        <div style={{margin:"12px 14px 0"}}>
          <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.12em",marginBottom:8}}>CATEGORY SPLIT</div>
          {Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([cat,count])=>(
            <div key={cat} style={{marginBottom:5}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.ink}}>{cat}</span>
                <span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>{count} pcs</span>
              </div>
              <div style={{height:2,background:T.grey1}}>
                <div style={{height:"100%",width:Math.round((count/wardrobe.length)*100)+"%",background:T.ink}}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OutfitArchive({ history }) {
  return (
    <div style={{padding:"0 0 20px"}}>
      <div style={{padding:"10px 14px 8px",borderBottom:"1px solid "+T.grey1}}>
        <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.14em"}}>OUTFIT HISTORY {"·"} {history.length} FITS LOGGED</div>
      </div>
      {history.length===0
        ?<div style={{padding:"40px 20px",textAlign:"center"}}>
          <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:22,color:T.grey1,lineHeight:.9,marginBottom:10}}>NO FITS<br/>LOGGED YET{"."}</div>
          <div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey3}}>Build an outfit and tap WORE IT TODAY.</div>
        </div>
        :history.map(entry=>(
          <div key={entry.id} style={{borderBottom:"1px solid "+T.grey1,padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>{entry.date}</div>
                {entry.saved
                  ? <span style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.red,border:"1px solid "+T.red,padding:"1px 5px",letterSpacing:"0.08em"}}>SAVED</span>
                  : <span style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3,border:"1px solid "+T.grey1,padding:"1px 5px",letterSpacing:"0.08em"}}>WORN</span>
                }
              </div>
            <div style={{display:"flex",gap:6}}>
              {entry.items.map(item=>(
                <div key={item.id} style={{flex:1,border:"1px solid "+T.grey1,overflow:"hidden",minWidth:0}}>
                  <ItemPhoto img={item.img||null} category={item.cat} brand="" height={60} small/>
                  <div style={{padding:"3px 5px",borderTop:"1px solid "+T.grey1}}>
                    <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:7,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      }
    </div>
  );
}

/* --- OUTFIT SUGGESTIONS --- */
function OutfitSuggestions({ posts, wardrobe, onBuildOutfit }) {
  // Derive style preferences from liked posts
  const likedPosts = posts.filter(p=>p.likedBy&&p.likedBy.includes("me"));
  const tagFreq = {};
  const catFreq = {};
  likedPosts.forEach(p=>{
    catFreq[p.cat]=(catFreq[p.cat]||0)+2;
    (p.tags||[]).forEach(t=>{tagFreq[t]=(tagFreq[t]||0)+1;});
  });
  wardrobe.forEach(item=>{
    catFreq[item.cat]=(catFreq[item.cat]||0)+1;
  });

  // Generate outfit combos from wardrobe
  const tops=wardrobe.filter(i=>i.cat==="Tops"||i.cat==="Dresses");
  const bottoms=wardrobe.filter(i=>i.cat==="Bottoms");
  const outer=wardrobe.filter(i=>i.cat==="Outerwear");
  const shoes=wardrobe.filter(i=>i.cat==="Shoes");
  const acc=wardrobe.filter(i=>i.cat==="Accessories");

  // Score each item based on taste profile
  const score = item => {
    let s=0;
    if(catFreq[item.cat]) s+=catFreq[item.cat];
    const t=(item.name+" "+(item.brand||"")+" "+(item.notes||"")).toLowerCase();
    Object.entries(tagFreq).forEach(([tag,freq])=>{ if(t.includes(tag.toLowerCase())) s+=freq; });
    if(item.wears>10) s+=2;
    return s;
  };

  // Build 3 suggested outfits
  const suggestions = [];
  const sortedTops=[...tops].sort((a,b)=>score(b)-score(a));
  const sortedBottoms=[...bottoms].sort((a,b)=>score(b)-score(a));
  const sortedShoes=[...shoes].sort((a,b)=>score(b)-score(a));
  const sortedOuter=[...outer].sort((a,b)=>score(b)-score(a));

  for(let i=0;i<3;i++){
    const outfit=[];
    if(sortedTops[i]) outfit.push(sortedTops[i]);
    if(sortedBottoms[i%sortedBottoms.length]) outfit.push(sortedBottoms[i%sortedBottoms.length]);
    if(sortedShoes[i%sortedShoes.length]) outfit.push(sortedShoes[i%sortedShoes.length]);
    if(i===0&&sortedOuter[0]) outfit.push(sortedOuter[0]);
    if(acc[i%acc.length]) outfit.push(acc[i%acc.length]);
    if(outfit.length>0) suggestions.push(outfit);
  }

  const labels=["TODAY'S PICK","WEEKEND FIT","CLEAN OPTION"];

  if(wardrobe.length===0) return (
    <div style={{padding:"32px 16px",textAlign:"center"}}>
      <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:22,color:T.grey1,lineHeight:.9,marginBottom:10}}>ADD PIECES<br/>FIRST.</div>
      <div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey3}}>Scan or add items to your closet to get outfit suggestions.</div>
    </div>
  );

  return (
    <div style={{padding:"0 0 20px"}}>
      <div style={{padding:"10px 14px 8px",borderBottom:"1px solid "+T.grey1}}>
        <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.14em"}}>
          {likedPosts.length>0?"BASED ON YOUR LIKES + WARDROBE":"BASED ON YOUR WARDROBE"}
        </div>
      </div>
      {suggestions.map((outfit,si)=>(
        <div key={si} style={{borderBottom:"2px solid "+T.ink,padding:"14px 14px 12px"}}>
          {/* label */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.ink,letterSpacing:"0.08em"}}>{labels[si]}</div>
            <button onClick={()=>onBuildOutfit(outfit)} style={{background:"none",border:"1px solid "+T.grey1,color:T.grey3,padding:"3px 10px",fontFamily:"'Courier Prime',monospace",fontSize:8,cursor:"pointer",letterSpacing:"0.08em"}}>BUILD {"→"}</button>
          </div>
          {/* piece grid */}
          <div style={{display:"flex",gap:6}}>
            {outfit.map(item=>(
              <div key={item.id} style={{flex:1,border:"1px solid "+T.grey1,overflow:"hidden",minWidth:0}}>
                <ItemPhoto img={item.img||null} category={item.cat} brand="" height={70} small/>
                <div style={{padding:"4px 5px",borderTop:"1px solid "+T.grey1}}>
                  <div style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3,textTransform:"uppercase",letterSpacing:"0.06em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.cat}</div>
                  <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:8,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.2}}>{item.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* --- DAILY THEME CARD --- */
function DailyThemeCard({ theme, wardrobe, onPost, onGoCloset }) {
  const [open, setOpen] = useState(false);
  const matched = wardrobe.filter(item => theme.matchFn(item)).slice(0, 4);
  const hasMatches = matched.length > 0;
  return (
    <div style={{margin:"12px 12px 0",border:`2px solid ${T.ink}`,background:T.ink,position:"relative",overflow:"hidden"}}>
      {/* accent stripe */}
      <div style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:theme.accent}}/>
      {/* header row */}
      <div style={{padding:"12px 14px 10px 18px",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.22em",textTransform:"uppercase",marginBottom:4}}>{theme.issue} &nbsp;.&nbsp; TODAY'S AESTHETIC</div>
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:20,color:T.paper,letterSpacing:"0.02em",lineHeight:1,marginBottom:6}}>{theme.name}</div>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:11,color:theme.accent==="#0D0D0D"?"#aaa":theme.accent,letterSpacing:"0.04em",fontStyle:"italic"}}>{theme.directive}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
            {theme.niche && (
              <div style={{background:"transparent",border:`1px solid ${theme.niche ? T.yellow : theme.accent}`,padding:"2px 8px",marginBottom:3}}>
                <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:7,color:theme.accent,letterSpacing:"0.18em"}}>* RARE DROP</span>
              </div>
            )}
            <div style={{background:T.red,padding:"3px 8px"}}>
              <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:7,color:T.paper,letterSpacing:"0.14em"}}>TODAY</span>
            </div>
            <span style={{fontFamily:"'Courier Prime',monospace",fontSize:12,color:T.grey2,transition:"transform .15s",display:"inline-block",transform:open?"rotate(180deg)":"none"}}>v</span>
          </div>
        </div>
      </div>
      {/* expanded */}
      {open && (
        <div style={{borderTop:`1px solid #ffffff18`,background:"#ffffff06"}}>
          {/* editorial */}
          <div style={{padding:"12px 18px",borderBottom:`1px solid #ffffff12`}}>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:11,color:T.grey2,lineHeight:1.8}}>{theme.editorial}</div>
          </div>
          {/* wardrobe suggestions */}
          <div style={{padding:"12px 14px 14px 18px"}}>
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:9,color:T.grey3,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>
              {hasMatches ? "PIECES FROM YOUR CLOSET" : "YOUR CLOSET SUGGESTION"}
            </div>
            {!hasMatches ? (
              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:11,color:T.grey3,fontStyle:"italic",marginBottom:12,lineHeight:1.7}}>
                No matching pieces found yet. Add more items to your closet and VYUU will pull the right ones for each theme.
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                {matched.map(item=>(
                  <div key={item.id} style={{display:"flex",gap:10,alignItems:"center",background:"#ffffff0a",border:`1px solid #ffffff14`,padding:"9px 12px"}}>
                    <div style={{width:36,height:36,background:"#ffffff08",border:`1px solid #ffffff20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <ClothingShape category={item.cat} size={24}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.paper,letterSpacing:"0.02em",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div>
                      <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>{item.brand&&item.brand+" . "}{item.cat}</div>
                    </div>
                    <div style={{maxWidth:140,flexShrink:0}}>
                      <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:theme.accent==="#0D0D0D"?"#aaa":theme.accent,lineHeight:1.5,fontStyle:"italic",textAlign:"right"}}>{theme.whyFn(item)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* CTA row */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={()=>onPost(theme.prompt)} style={{flex:1,background:T.red,border:"none",color:T.paper,padding:"9px 12px",fontFamily:"'Archivo Black',sans-serif",fontSize:9,letterSpacing:"0.1em",cursor:"pointer",textTransform:"uppercase",transition:"opacity .1s"}}
                onMouseEnter={e=>e.currentTarget.style.opacity=".85"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                RESPOND TO THEME {"→"}
              </button>
              <button onClick={onGoCloset} style={{background:"transparent",border:`2px solid #ffffff28`,color:T.grey2,padding:"9px 12px",fontFamily:"'Courier Prime',monospace",fontSize:9,letterSpacing:"0.1em",cursor:"pointer",textTransform:"uppercase",whiteSpace:"nowrap",transition:"border-color .1s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#ffffff66"} onMouseLeave={e=>e.currentTarget.style.borderColor="#ffffff28"}>
                OPEN CLOSET
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -----------------------------------------------------------------------------
   MAIN APP
----------------------------------------------------------------------------- */
function UserSearchOverlay({ onClose, onUser }) {
  const [q, setQ] = useState("");
  const inputRef = useRef();
  useEffect(function(){ setTimeout(function(){ if(inputRef.current) inputRef.current.focus(); }, 80); }, []);
  var allUsers = Object.values(USERS).filter(function(u){ return u.id !== "me"; });
  var results = q.trim().length > 0
    ? allUsers.filter(function(u){ var lq=q.toLowerCase(); return u.name.toLowerCase().includes(lq)||u.handle.toLowerCase().includes(lq); })
    : allUsers.slice(0,4);
  var isEmpty = q.trim().length > 0 && results.length === 0;
  return (
    <div style={{position:"fixed",inset:0,background:T.paper,zIndex:500,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto"}}>
      <div style={{background:T.ink,padding:"14px 16px 12px",display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",padding:"10px 14px"}}>
          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:13,color:"rgba(255,255,255,0.4)"}}>S</span>
          <input ref={inputRef} value={q} onChange={function(e){setQ(e.target.value);}} placeholder="search people..." style={{flex:1,background:"none",border:"none",outline:"none",fontFamily:"'Courier Prime',monospace",fontSize:12,color:"#ffffff"}}/>
          {q&&<button onClick={function(){setQ("");}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>{"×"}</button>}
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontFamily:"'Courier Prime',monospace",fontSize:10,letterSpacing:"0.1em",flexShrink:0,padding:"4px 0"}}>CANCEL</button>
      </div>
      <div style={{padding:"10px 16px 8px",borderBottom:"1px solid "+T.grey1}}>
        <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.18em"}}>{q.trim().length>0?(results.length+" RESULT"+(results.length!==1?"S":"")):"SUGGESTED"}</span>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {isEmpty?(
          <div style={{padding:"48px 20px",textAlign:"center"}}>
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:24,color:T.grey1,lineHeight:.9,marginBottom:10}}>NO ONE FOUND.</div>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey3}}>No users matching that search.</div>
          </div>
        ):results.map(function(u){ return (
          <button key={u.id} onClick={function(){onUser(u.id);onClose();}} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"transparent",border:"none",borderBottom:"1px solid "+T.grey1,cursor:"pointer",textAlign:"left"}}>
            <UserAvatar name={u.name} size={44}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:13,color:T.ink,marginBottom:3}}>{u.name}</div>
              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey3,marginBottom:4}}>@{u.handle} {"·"} {u.followers.toLocaleString()} followers</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {u.styles&&u.styles.map(function(s){ return <span key={s} style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3,border:"1px solid "+T.grey1,padding:"1px 5px",letterSpacing:"0.08em"}}>{s}</span>; })}
              </div>
            </div>
          </button>
        );})}
      </div>
    </div>
  );
}

function MHdr({ title, onC, inv }) {
  var bg = inv ? T.ink : T.paper;
  var fg = inv ? T.paper : T.ink;
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",borderBottom:"2px solid "+T.ink,background:bg}}>
      <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:12,color:fg,letterSpacing:"0.1em"}}>{title}</div>
      <button style={{background:"none",border:"none",color:fg,cursor:"pointer",fontSize:16,fontFamily:"'Archivo Black',sans-serif"}} onClick={onC}>{"×"}</button>
    </div>
  );
}

function App() {


  useEffect(()=>{
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=Archivo+Black&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Rubik+Dirt&display=swap';
    document.head.appendChild(link);
  },[]);
  const [onboarded,setOnboarded]=useState(()=>{try{var s=localStorage.getItem("vyuu_onboarded");return s?JSON.parse(s):false;}catch(e){return false;}});
  const [meUser,setMeUser]=useState(()=>{try{var s=localStorage.getItem("vyuu_meUser");return s?JSON.parse(s):USERS.me;}catch(e){return USERS.me;}});
  const [darkMode,setDarkMode]=useState(()=>{try{var s=localStorage.getItem("vyuu_darkMode");return s?JSON.parse(s):false;}catch(e){return false;}});
  const DT=darkMode?{paper:"#0D0D0D",ink:"#F2EFE9",yellow:T.yellow,red:T.red,grey1:"#2A2A2A",grey2:"#4A4A4A",grey3:"#8A8A8A",wash:"#1A1A1A",stamp:"#F2EFE9",border:"#F2EFE9"}:T;
  const [showEditProfile,setShowEditProfile]=useState(false);
  const [editDraft,setEditDraft]=useState(null);
  const [tab,setTab]=useState("Feed");
  const [posts,setPosts]=useState(()=>{try{var s=localStorage.getItem("vyuu_posts");return s?JSON.parse(s):INIT_POSTS;}catch(e){return INIT_POSTS;}});
  const [listings,setListings]=useState(INIT_LISTINGS);
  const [wardrobe,setWardrobe]=useState(()=>{try{var s=localStorage.getItem("vyuu_wardrobe");return s?JSON.parse(s):INIT_WARDROBE;}catch(e){return INIT_WARDROBE;}});
  const [profUid,setProfUid]=useState("me");
  const [showUserSearch,setShowUserSearch]=useState(false);
  const [showGlobalSearch,setShowGlobalSearch]=useState(false);
  const [blocked,setBlocked]=useState([]);
  const [reported,setReported]=useState([]);
  const blockUser=uid=>{setBlocked(b=>[...b,uid]);setNotifs(n=>[{id:"blk"+Date.now(),type:"like",user:"me",text:"@"+((USERS[uid]&&USERS[uid].handle)||uid)+" has been blocked",time:"now",read:false},...n]);};
  const reportItem=(uid,reason)=>{setReported(r=>[...r,uid]);};
  const [selL,setSelL]=useState(null);
  const [selW,setSelW]=useState(null);
  const [mCat,setMCat]=useState("All");
  const [mSearch,setMSearch]=useState("");
  const [mySizeOnly,setMySizeOnly]=useState(false);
  const [watched,setWatched]=useState([]);
  const createBundle=(ids,price,disc)=>{
    var items=listings.filter(l=>ids.includes(l.id));
    var ttl=items.map(l=>l.title.split(" ")[0]).join(" + ")+" Bundle";
    setListings(l=>[{id:"b"+Date.now(),user:"me",title:ttl,brand:"Bundle",
      price,retail:items.reduce((s,i)=>s+i.price,0),size:"Various",
      cat:items.length>0?items[0].cat:"Tops",cond:"Various",
      desc:ids.length+" items "+disc+"% off.",
      auction:false,ends:null,bids:[],offers:[],verified:false},...l]);
  };





  const [soldItems,setSoldItems]=useState([]);
  const [ratings,setRatings]=useState({});
  const markSold=(l)=>{setSoldItems(s=>[{...l,soldAt:l.price,soldDate:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})},...s]);setListings(ls=>ls.filter(x=>x.id!==l.id));};
  const rateUser=(uid,stars,comment)=>{setRatings(r=>({...r,[uid]:[...(r[uid]||[]),{stars,comment,date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}]}));setNotifs(n=>[{id:"rat"+Date.now(),type:"like",user:uid,text:stars+" star rating received",time:"now",read:false},...n]);};
  const toggleWatch=(id)=>setWatched(w=>w.includes(id)?w.filter(x=>x!==id):[...w,id]);
  const [mType,setMType]=useState("all");
  const [mCond,setMCond]=useState("All");
  const [outfit,setOutfit]=useState([]);
  const [showScan,setShowScan]=useState(false);
  const [showNP,setShowNP]=useState(false);
  const [showNL,setShowNL]=useState(false);
  const [showAW,setShowAW]=useState(false);
  const [showOB,setShowOB]=useState(false);
  const [outfitHistory,setOutfitHistory]=useState(()=>{try{var s=localStorage.getItem("vyuu_outfitHistory");return s?JSON.parse(s):[];}catch(e){return [];}});
  const [showDM,setShowDM]=useState(false);
  const [showNotifs,setShowNotifs]=useState(false);
  const [showShare,setShowShare]=useState(null);
  const [dms,setDms]=useState(INIT_DMS);
  const [notifs,setNotifs]=useState(INIT_NOTIFS);
  const [discoverMode,setDiscoverMode]=useState(false);
  const [feedSearch,setFeedSearch]=useState("");
  const [tagPage,setTagPage]=useState(null);
  const [reposts,setReposts]=useState([]);
  const [saved,setSaved]=useState(()=>{try{var s=localStorage.getItem("vyuu_saved");return s?JSON.parse(s):[];}catch(e){return [];}});
  const toggleSave=id=>setSaved(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const repost=id=>{if(!reposts.includes(id)){setReposts(r=>[...r,id]);setPosts(p=>p.map(post=>post.id===id?{...post,reposts:(post.reposts||0)+1}:post));}};
  const [following,setFollowing]=useState(()=>{try{var s=localStorage.getItem("vyuu_following");return s?JSON.parse(s):["alex","maya"];}catch(e){return ["alex","maya"];}});

  // Persist key state to localStorage
  useEffect(()=>{
    try{
      localStorage.setItem("vyuu_wardrobe",JSON.stringify(wardrobe));
      localStorage.setItem("vyuu_posts",JSON.stringify(posts));
      localStorage.setItem("vyuu_following",JSON.stringify(following));
      localStorage.setItem("vyuu_saved",JSON.stringify(saved));
      localStorage.setItem("vyuu_outfitHistory",JSON.stringify(outfitHistory));
      localStorage.setItem("vyuu_meUser",JSON.stringify(meUser));
      localStorage.setItem("vyuu_onboarded",JSON.stringify(onboarded));
      localStorage.setItem("vyuu_darkMode",JSON.stringify(darkMode));
    }catch(e){}
  },[wardrobe,posts,following,saved,outfitHistory,meUser,onboarded,darkMode]);

  const toggleFollow=uid=>{
    var wasFollowing=following.includes(uid);
    setFollowing(f=>wasFollowing?f.filter(x=>x!==uid):[...f,uid]);
    if(!wasFollowing){
      setNotifs(n=>[{id:"nf"+Date.now(),type:"follow",user:uid,text:"you started following @"+((USERS[uid]&&USERS[uid].handle)||uid),time:"now",read:false},...n].slice(0,50));
    }
  };
  const toggleShop=()=>setMeUser(u=>({...u,isShop:!u.isShop}));
  const [np,setNp]=useState({caption:"",cat:"Tops",tags:"",img:null,imgs:[],items:[]});
  const [showWardrobePicker,setShowWardrobePicker]=useState(false);
  const [nl,setNl]=useState({title:"",brand:"",price:"",retail:"",size:"",chest:"",waist:"",hips:"",cond:"Like New",cat:"Tops",desc:"",auction:false,ends:"3d",img:null});
  const [ni,setNi]=useState({name:"",cat:"Tops",brand:"",size:"",mat:"",chest:"",waist:"",hips:"",len:"",inseam:"",notes:"",img:null});

  const like=id=>{
    setPosts(ps=>ps.map(p=>{
      if(p.id!==id) return p;
      var wasLiked=p.likedBy.includes("me");
      if(!wasLiked&&p.user!=="me"){
        setNotifs(n=>[{id:"nl"+Date.now(),type:"like",user:p.user,text:"liked your post",time:"now",read:false},...n].slice(0,50));
      }
      return {...p,likes:wasLiked?p.likes-1:p.likes+1,likedBy:wasLiked?p.likedBy.filter(u=>u!=="me"):[...p.likedBy,"me"]};
    }));
  };
  const scanResult=r=>{setNi(i=>({...i,...r,id:null,img:r.img||null}));setShowScan(false);setShowAW(true);};
  const addPost=()=>{if(!np.caption.trim())return;setPosts(p=>[{id:"p"+Date.now(),user:"me",...np,likes:0,likedBy:[],comments:[],time:"now",tags:np.tags?np.tags.split(",").map(t=>t.trim().replace(/^#/,"")):[]},...p]);setNp({caption:"",cat:"Tops",tags:"",img:null,imgs:[],items:[]});setShowNP(false);};
  const addListing=()=>{if(!nl.title||!nl.price)return;var now=new Date();var dateStr=now.toLocaleDateString("en-US",{month:"short",year:"numeric"});setListings(l=>[{id:"l"+Date.now(),user:"me",...nl,price:parseInt(nl.price),retail:parseInt(nl.retail||nl.price),bids:[],offers:[],verified:false,verReq:false,priceHistory:[{date:dateStr,price:parseInt(nl.price)}]},...l]);setNl({title:"",brand:"",price:"",retail:"",size:"",chest:"",waist:"",hips:"",cond:"Like New",cat:"Tops",desc:"",auction:false,ends:"3d",img:null});setShowNL(false);};
  const addWardrobe=()=>{if(!ni.name.trim())return;setWardrobe(w=>[...w,{...ni,id:"w"+Date.now(),wears:0,lastWorn:"Never"}]);setNi({name:"",cat:"Tops",brand:"",size:"",mat:"",chest:"",waist:"",hips:"",len:"",inseam:"",notes:"",img:null});setShowAW(false);};
  const toggleOutfit=item=>setOutfit(p=>p.find(i=>i.id===item.id)?p.filter(i=>i.id!==item.id):[...p,item]);
  const markWorn=id=>setWardrobe(w=>w.map(item=>item.id===id?{...item,wears:item.wears+1,lastWorn:"Today"}:item));
  const [activeSection,setActiveSection]=useState("wardrobe");
  const [wardSearch,setWardSearch]=useState(""); // wardrobe | forgotten | taste
  const [showZine,setShowZine]=useState(false);
  const listForgotten=(item)=>{setNl(l=>({...l,title:item.name,brand:item.brand||"",cat:item.cat,size:item.size||""}));setShowNL(true);};
  const markAllRead=()=>setNotifs(n=>n.map(x=>({...x,read:true})));
  const checkPriceDrops=(updatedListings)=>{
    updatedListings.forEach(l=>{
      if(watched.includes(l.id)&&l.prevPrice&&l.price<l.prevPrice){
        setNotifs(n=>[{id:"pd"+l.id,type:"pricedrop",user:"me",text:"Price dropped on "+l.title+": $"+l.prevPrice+" → $"+l.price,time:"now",read:false},...n.filter(x=>x.id!=="pd"+l.id)]);
      }
    });
  };
  const addMarketNotif=({type,listing,amount})=>{
    const txt=type==="bid"?"Your bid of $"+amount+" on "+listing+" was placed.":"Your offer of $"+amount+" on "+listing+" was sent.";
    setNotifs(n=>[{id:"n"+Date.now(),type,user:"me",text:txt,time:"now",read:false},...n]);
  };
  const unreadCount=notifs.filter(n=>!n.read).length;
  const unreadDMs=Object.values(dms).filter(t=>t.length>0&&t[t.length-1]?.from!=="me").length;
  var _q=mSearch.trim().toLowerCase();
  var mySizes=wardrobe.map(i=>i.size).filter(Boolean);
  const filtered=listings.filter(function(l){var s=USERS[l.user]||{};var mQ=!_q||(l.title||"").toLowerCase().includes(_q)||(l.brand||"").toLowerCase().includes(_q)||(l.cat||"").toLowerCase().includes(_q)||(s.name||"").toLowerCase().includes(_q)||(s.handle||"").toLowerCase().includes(_q);var sizeOk=!mySizeOnly||mySizes.some(s=>s&&l.size&&s.toLowerCase()===l.size.toLowerCase());var condOk=mCond==="All"||l.cond===mCond;return mQ&&sizeOk&&condOk&&(mCat==="All"||l.cat===mCat)&&(mType==="all"||(mType==="auction"?l.auction:!l.auction));});
  var visiblePosts=posts.filter(p=>!blocked.includes(p.user));
  const discoverPosts=[...visiblePosts].sort((a,b)=>b.likes-a.likes);
  const fq=feedSearch.trim().toLowerCase();
  const filteredFeed=fq?posts.filter(p=>(p.caption||"").toLowerCase().includes(fq)||(p.tags||[]).some(t=>t.toLowerCase().includes(fq))||(USERS[p.user]&&USERS[p.user].handle.toLowerCase().includes(fq))):null;
  const followingPosts=posts.filter(p=>following.includes(p.user));
  const todayPrompt=DAILY_PROMPTS[new Date().getDay()%DAILY_PROMPTS.length];
  // Pick today's theme - stable for the whole day via day-of-year seed
  var _day=Math.floor((Date.now()-new Date(new Date().getFullYear(),0,1))/86400000);
  var _dow=new Date().getDay(); // 0=Sun,1=Mon,...,5=Fri,6=Sat
  var _isWeekend=_dow===0||_dow===5||_dow===6;
  // Weekends: 60% chance of niche theme (seeded to stay stable all day)
  // Weekdays: niche only every 10th day
  var _nicheIdx=Math.floor(_day/1)%NICHE_THEMES.length;
  var _seed=(_day*2654435761)%100; // deterministic 0-99 from day
  var _showNiche=_isWeekend?_seed<60:_day%10===0;
  const todayTheme=_showNiche?NICHE_THEMES[_nicheIdx]:COMMON_THEMES[_day%COMMON_THEMES.length];

  const NAV=[{id:"Feed",icon:"★",label:"FEED"},{id:"Explore",icon:"//",label:"EXPLORE"},{id:"Market",icon:"$",label:"MARKET"},{id:"Wardrobe",icon:"▲",label:"CLOSET"},{id:"Profile",icon:"○",label:"YOU"}];

  const FINP={background:T.wash,border:`2px solid ${T.grey2}`,borderLeft:`2px solid ${T.ink}`,color:T.ink,padding:"9px 12px",fontSize:12,fontFamily:"'Courier Prime',monospace",outline:"none",width:"100%",boxSizing:"border-box",transition:"border-color .12s"};
  const LBL={fontSize:9,color:T.grey3,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:5,fontFamily:"'Courier Prime',monospace",fontWeight:700};
  const MOV={position:"fixed",inset:0,background:"rgba(13,13,13,.65)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",padding:16};
  const MBX=(bc=T.ink)=>({background:T.paper,border:`3px solid ${bc}`,boxShadow:`8px 8px 0 ${bc}`,width:"min(480px,100%)",maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",animation:"bladeIn .22s ease"});

  if(!onboarded) return <Onboarding onComplete={({name,handle,styles})=>{setMeUser(u=>({...u,name,handle,styles}));setOnboarded(true);}}/>;

  var APP_WRAP={
    background:T.paper,minHeight:"100vh",color:T.ink,
    display:"flex",flexDirection:"column",
    fontFamily:"'Courier Prime',monospace",
    maxWidth:480,margin:"0 auto",
    position:"relative",overflow:"hidden",
    boxShadow:"0 0 0 1px rgba(0,0,0,.08)"
  };
  return (
    <div style={APP_WRAP}>
      <style>{CSS}</style>
      <Grain/>

      {/* -- TOPBAR - zine masthead -- */}
      <header style={{background:T.ink,borderBottom:`3px solid ${T.ink}`,position:"sticky",top:0,zIndex:50,flexShrink:0}}>
        {/* top strip - issue number, date */}
        <div style={{display:"flex",justifyContent:"space-between",padding:"4px 14px",borderBottom:`1px solid ${T.grey3}33`}}>
          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey2,letterSpacing:"0.16em",textTransform:"uppercase"}}>Issue No. 001</span>
          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey2,letterSpacing:"0.1em"}}>vyuu.app</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px"}}>
          <Logo size={26}/>
          {/* scrolling ticker */}
          <div style={{flex:1,margin:"0 10px",overflow:"hidden",height:16}}>
            <div style={{animation:"marquee 20s linear infinite",whiteSpace:"nowrap",fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3,letterSpacing:"0.18em"}}>
              {"NEW ARRIVALS "}<span style={{color:T.yellow}}>{" . "}</span>{" LIVE AUCTIONS "}<span style={{color:T.yellow}}>{" . "}</span>{" TRENDING NOW "}<span style={{color:T.yellow}}>{" . "}</span>{" VYUU "}<span style={{color:T.yellow}}>{" . "}</span>{" NEW ARRIVALS "}<span style={{color:T.yellow}}>{" . "}</span>{" LIVE AUCTIONS "}<span style={{color:T.yellow}}>{" . "}</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={function(){setShowUserSearch(true);}} style={{background:"none",border:"none",cursor:"pointer",color:T.grey2,padding:"4px 6px",fontFamily:"'Courier Prime',monospace",fontSize:14,lineHeight:1}}>S</button>
            <button onClick={()=>setShowDM(true)} style={{background:"none",border:"none",cursor:"pointer",color:T.grey2,padding:4,position:"relative",fontFamily:"'Courier Prime',monospace",fontSize:14,transition:"color .1s"}}
              onMouseEnter={e=>e.currentTarget.style.color=T.paper} onMouseLeave={e=>e.currentTarget.style.color=T.grey2}>
              @
              {unreadDMs>0&&<span style={{position:"absolute",top:0,right:0,background:T.red,color:T.paper,fontSize:7,width:10,height:10,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Archivo Black',sans-serif"}}>{unreadDMs}</span>}
            </button>
            <button onClick={()=>setShowNotifs(true)} style={{background:"none",border:"none",cursor:"pointer",color:T.grey2,padding:4,position:"relative",fontSize:14,transition:"color .1s"}}
              onMouseEnter={e=>e.currentTarget.style.color=T.paper} onMouseLeave={e=>e.currentTarget.style.color=T.grey2}>
              o
              {unreadCount>0&&<span style={{position:"absolute",top:0,right:0,background:T.red,color:T.paper,fontSize:7,width:10,height:10,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Archivo Black',sans-serif"}}>{unreadCount}</span>}
            </button>
            <div onClick={()=>{setProfUid("me");setTab("Profile");}} style={{cursor:"pointer"}}>
              <div style={{width:27,height:27,border:`2px solid ${T.grey2}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"border-color .1s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=T.paper} onMouseLeave={e=>e.currentTarget.style.borderColor=T.grey2}>
                <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:9,color:T.grey2,letterSpacing:"0.04em"}}>{meUser.name.split(" ").map(w=>w[0]).join("")}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* -- MAIN -- */}
      <main style={{flex:1,overflowY:"auto",paddingBottom:60,position:"relative",zIndex:1}}>

        {/* FEED */}
        <Blade active={tab==="Feed"}>
          {/* masthead section switcher */}
          <div style={{background:T.wash,borderBottom:`3px solid ${T.ink}`,position:"sticky",top:0,zIndex:10,padding:"0 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:0,paddingTop:10,paddingBottom:0}}>
              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.2em",textTransform:"uppercase",marginRight:12,paddingBottom:10}}>VYUU DAILY</div>
              {[["FOLLOWING",false],["DISCOVER",true]].map(([l,v])=>(
                <button key={l} onClick={()=>setDiscoverMode(v)} style={{background:"none",border:"none",borderBottom:discoverMode===v?`3px solid ${T.ink}`:`3px solid transparent`,color:discoverMode===v?T.ink:T.grey3,padding:"0 12px 10px",fontSize:9,cursor:"pointer",fontFamily:"'Archivo Black',sans-serif",letterSpacing:"0.12em",transition:"all .12s",marginBottom:-3}}>{l}</button>
              ))}
            </div>
          </div>
          <StoriesBar posts={posts} following={following} onUser={uid=>{setProfUid(uid);setTab("Profile");}}/>
          {/* OOTD Leaderboard - show global on discover, friends board on following */}
          {discoverMode
            ? <OOTDLeaderboard posts={posts} setPosts={setPosts} onUser={uid=>{setProfUid(uid);setTab("Profile");}}/>
            : <FriendsLeaderboard posts={posts} following={following} onUser={uid=>{setProfUid(uid);setTab("Profile");}} onDiscover={()=>setDiscoverMode(true)}/>
          }
          {/* Who Wore It Better */}
          <WhoWoreItBetter posts={posts} setPosts={setPosts} onUser={uid=>{setProfUid(uid);setTab("Profile");}}/>
          {/* Daily Theme Card */}
          <DailyThemeCard theme={todayTheme} wardrobe={wardrobe} onPost={p=>{setNp(np=>({...np,caption:p+' '}));setShowNP(true);}} onGoCloset={()=>setTab('Wardrobe')}/>
          {/* Feed search */}
          {feedSearch||false?null:null}
          <div style={{borderBottom:"1px solid "+T.grey1,display:"flex",alignItems:"center",position:"relative"}}>
            <input value={feedSearch} onChange={e=>setFeedSearch(e.target.value)} placeholder="search posts, tags, @people..." style={{flex:1,background:"transparent",border:"none",outline:"none",padding:"10px 36px 10px 14px",fontFamily:"'Courier Prime',monospace",fontSize:11,color:T.ink}}/>
            {feedSearch&&<button onClick={()=>setFeedSearch("")} style={{position:"absolute",right:10,background:"none",border:"none",cursor:"pointer",fontSize:14,color:T.grey3,lineHeight:1}}>{"×"}</button>}
          </div>
          {/* Post bar - zine submission style */}
          <div onClick={()=>setShowNP(true)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderBottom:`3px solid ${T.ink}`,borderTop:`1px solid ${T.grey1}`,cursor:"pointer",background:T.wash,transition:"background .1s"}}
            onMouseEnter={e=>e.currentTarget.style.background=T.grey1} onMouseLeave={e=>e.currentTarget.style.background=T.wash}>
            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3,letterSpacing:"0.16em",textTransform:"uppercase",flexShrink:0}}>SUBMIT {"→"}</div>
            <span style={{flex:1,fontSize:11,color:T.grey3,fontFamily:"'Courier Prime',monospace",fontStyle:"italic"}}>share your fit...</span>
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:9,color:T.ink,border:`2px solid ${T.ink}`,padding:"4px 10px",letterSpacing:"0.06em"}}>POST</div>
          </div>
          {/* Zine feed - each post gets a different layout */}
          <div>
            {discoverMode
              ? (filteredFeed||discoverPosts).map((p,i)=><ZinePost key={p.id} post={p} idx={i} onUser={uid=>{setProfUid(uid);setTab("Profile");}} onLike={like} setAllPosts={setPosts} setPosts={setPosts} onShare={item=>setShowShare({item,type:"post"})} onRepost={repost} reposts={reposts} onSave={toggleSave} saved={saved} onDM={uid=>{setProfUid(uid);setShowDM(true);}} onTag={tag=>setTagPage(tag)} onNotify={n=>{if(n.user&&n.user!=="me")setNotifs(ns=>[{id:"nn"+Date.now(),type:n.type,user:n.user,text:n.text||n.type,time:"now",read:false},...ns].slice(0,50));}}/>)
              : (filteredFeed||(followingPosts.length>0?followingPosts:null))?((filteredFeed||followingPosts).map((p,i)=><ZinePost key={p.id} post={p} idx={i} onUser={uid=>{setProfUid(uid);setTab("Profile");}} onLike={like} setAllPosts={setPosts} setPosts={setPosts} onShare={item=>setShowShare({item,type:"post"})} onRepost={repost} reposts={reposts} onSave={toggleSave} saved={saved} onDM={uid=>{setProfUid(uid);setShowDM(true);}} onTag={tag=>setTagPage(tag)} onNotify={n=>{if(n.user&&n.user!=="me")setNotifs(ns=>[{id:"nn"+Date.now(),type:n.type,user:n.user,text:n.text||n.type,time:"now",read:false},...ns].slice(0,50));}}/>
))
                : (
                  <div style={{padding:"48px 20px",textAlign:"center"}}>
                    <div style={{fontFamily:"'Rubik Dirt',sans-serif",fontSize:36,color:T.grey1,lineHeight:.9,letterSpacing:"-0.02em",marginBottom:14}}>
                      NO FITS<br/>YET<span style={{color:T.yellow}}>.</span>
                    </div>
                    <div style={{fontFamily:"'Courier Prime',monospace",fontSize:11,color:T.grey3,lineHeight:1.8,marginBottom:20}}>
                      Follow some people to see their fits here.
                    </div>
                    <button onClick={()=>setDiscoverMode(true)} style={{background:T.ink,border:"none",color:T.paper,padding:"12px 24px",fontFamily:"'Archivo Black',sans-serif",fontSize:10,letterSpacing:"0.1em",cursor:"pointer"}}>
                      DISCOVER PEOPLE {"→"}
                    </button>
                  </div>
                )
            }
          </div>
        </Blade>

        {/* EXPLORE */}
        <Blade active={tab==="Explore"}>
          {/* massive header */}
          <div style={{padding:"20px 16px 0",borderBottom:`2px solid ${T.ink}`,overflow:"hidden"}}>
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:64,lineHeight:.85,color:T.ink,letterSpacing:"-0.04em",marginBottom:16}}>
              EX<br/>PLO<br/>RE<span style={{color:T.yellow}}>.</span>
            </div>
            <div style={{display:"flex",gap:6,paddingBottom:12,overflowX:"auto"}}>
              {["#vintage","#minimal","#streetwear","#lemaire","#stoneisland","#thrift","#y2k","#techwear"].map(t=>(
                <span key={t} style={{fontSize:9,color:T.grey3,border:`1px solid ${T.grey1}`,padding:"3px 9px",whiteSpace:"nowrap",cursor:"pointer",fontFamily:"'Courier Prime',monospace",letterSpacing:"0.06em",transition:"all .1s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=T.ink;e.currentTarget.style.color=T.paper;e.currentTarget.style.borderColor=T.ink;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.grey3;e.currentTarget.style.borderColor=T.grey1;}}>{t}</span>
              ))}
            </div>
          </div>
          {/* trending hashtags */}
          {(()=>{
            var tagCounts={};
            posts.forEach(p=>(p.tags||[]).forEach(t=>{tagCounts[t]=(tagCounts[t]||0)+1;}));
            var trending=Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);
            if(!trending.length) return null;
            return (
              <div style={{borderBottom:"2px solid "+T.ink}}>
                <div style={{background:T.ink,padding:"8px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:9,color:T.yellow,letterSpacing:"0.14em"}}>TRENDING NOW</span>
                  <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>by post count</span>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:0}}>
                  {trending.map(([tag,count],i)=>(
                    <button key={tag} onClick={()=>setTagPage(tag)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"50%",padding:"10px 14px",background:"none",border:"none",borderRight:i%2===0?"1px solid "+T.grey1:"none",borderBottom:"1px solid "+T.grey1,cursor:"pointer",textAlign:"left",boxSizing:"border-box"}}>
                      <div>
                        <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.ink}}>{"#"}{tag}</div>
                        <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,marginTop:1}}>{count} post{count!==1?"s":""}</div>
                      </div>
                      <span style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey2}}>{"→"}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
          {/* asymmetric grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
            {discoverPosts.map((p,i)=>(
              <div key={p.id} style={{overflow:"hidden",position:"relative",cursor:"pointer",gridRow:i===0?"span 2":undefined,borderRight:i%2===0?`1px solid ${T.ink}`:"none",borderBottom:`1px solid ${T.ink}`}}>
                <ItemPhoto img={p.img} category={p.cat} brand="" height={i===0?290:148} small={i!==0}/>
                <div style={{padding:"8px 10px",background:T.paper,borderTop:`1px solid ${T.grey1}`}}>
                  <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.ink,marginBottom:1,letterSpacing:"0.02em"}}>{USERS[p.user]?.name}</div>
                  <div style={{fontSize:9,color:T.grey3,fontFamily:"'Courier Prime',monospace"}}>{"♥"} {p.likes.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        <ThemeChallenge/>
        {/* Style-based people discovery */}
        <div style={{margin:"16px 12px 0",border:"2px solid "+T.ink}}>
          <div style={{background:T.ink,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:9,color:T.yellow,letterSpacing:"0.14em"}}>FIND YOUR PEOPLE</span>
            <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>MATCHED BY STYLE</span>
          </div>
          {STYLE_TAGS.slice(0,4).map(tag=>{
            const matched=Object.values(USERS).filter(u=>u.id!=="me"&&u.styles&&u.styles.includes(tag));
            if(!matched.length) return null;
            return (
              <div key={tag} style={{borderBottom:"1px solid "+T.grey1,padding:"10px 12px"}}>
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.12em",marginBottom:8,textTransform:"uppercase"}}>{tag}</div>
                <div style={{display:"flex",gap:8,overflowX:"auto"}}>
                  {matched.map(u=>(
                    <button key={u.id} onClick={()=>{setProfUid(u.id);setTab("Profile");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",flexShrink:0,padding:"0 4px"}}>
                      <UserAvatar name={u.name} size={36} highlight={following&&following.includes(u.id)}/>
                      <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:8,color:T.ink,whiteSpace:"nowrap"}}>{u.name.split(" ")[0]}</span>
                      <span style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3}}>@{u.handle}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{height:20}}/>
        </Blade>

        {/* MARKET */}
        <Blade active={tab==="Market"}>
          <div style={{padding:"20px 16px 12px",borderBottom:`2px solid ${T.ink}`,display:"flex",justifyContent:"space-between",alignItems:"flex-end",background:T.paper}}>
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:44,lineHeight:.85,color:T.ink,letterSpacing:"-0.03em"}}>
              MAR<br/>KET<span style={{color:T.yellow}}>.</span>
            </div>
            <Btn variant="red" style={{padding:"7px 14px",fontSize:9,alignSelf:"flex-end"}} onClick={()=>setShowNL(true)}>+ LIST</Btn>
          </div>
          {/* search */}
          <div style={{borderBottom:"2px solid "+T.ink,display:"flex",alignItems:"center",position:"relative"}}>
            <input
              value={mSearch}
              onChange={function(e){setMSearch(e.target.value);}}
              placeholder="search item, brand, or @seller..."
              style={{flex:1,background:"transparent",border:"none",outline:"none",padding:"11px 36px 11px 14px",fontFamily:"'Courier Prime',monospace",fontSize:11,color:T.ink}}
            />
            {mSearch&&(
              <button onClick={function(){setMSearch("");}} style={{position:"absolute",right:10,background:"none",border:"none",cursor:"pointer",fontSize:13,color:T.grey3,lineHeight:1}}>{"×"}</button>
            )}
          </div>
          {mSearch&&Object.values(USERS).filter(function(u){var q=mSearch.toLowerCase();return u.id!=="me"&&(u.name.toLowerCase().includes(q)||u.handle.toLowerCase().includes(q));}).length>0&&(
            <div style={{padding:"6px 12px",borderBottom:"1px solid "+T.grey1,display:"flex",gap:6,overflowX:"auto",background:T.wash}}>
              <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.12em",alignSelf:"center",flexShrink:0}}>SELLERS:</span>
              {Object.values(USERS).filter(function(u){var q=mSearch.toLowerCase();return u.id!=="me"&&(u.name.toLowerCase().includes(q)||u.handle.toLowerCase().includes(q));}).map(function(u){return(
                <button key={u.id} onClick={function(){setMSearch(u.handle);}} style={{display:"flex",alignItems:"center",gap:5,background:T.paper,border:"1px solid "+T.grey1,padding:"3px 8px",cursor:"pointer",flexShrink:0}}>
                  <UserAvatar name={u.name} size={14}/>
                  <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:8,color:T.ink}}>@{u.handle}</span>
                </button>
              );})}
            </div>
          )}
          {/* filters */}
          <div style={{padding:"10px 12px 8px",display:"flex",gap:5,overflowX:"auto",borderBottom:"1px solid "+T.grey1}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setMCat(c)} style={{background:mCat===c?T.ink:"transparent",border:"1px solid "+(mCat===c?T.ink:T.grey2),color:mCat===c?T.paper:T.grey3,padding:"4px 10px",fontSize:9,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Courier Prime',monospace",letterSpacing:"0.06em",transition:"all .1s"}}>{c}</button>
            ))}
          </div>
          <div style={{padding:"6px 12px",display:"flex",gap:5,borderBottom:"1px solid "+T.grey1,overflowX:"auto"}}>
            {["All",...CONDS].map(c=>(
              <button key={c} onClick={()=>setMCond(c)} style={{background:mCond===c?T.ink:"transparent",border:"1px solid "+(mCond===c?T.ink:T.grey2),color:mCond===c?T.paper:T.grey3,padding:"3px 9px",fontSize:8,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Courier Prime',monospace",letterSpacing:"0.06em",flexShrink:0}}>{c==="All"?"ANY COND":c.toUpperCase()}</button>
            ))}
          </div>
          <div style={{padding:"8px 12px",display:"flex",gap:5,borderBottom:"2px solid "+T.ink,flexWrap:"wrap"}}>
            {[["all","ALL"],["auction","AUCTION"],["buy","BUY NOW"]].map(([v,l])=>(
              <button key={v} onClick={()=>setMType(v)} style={{background:mType===v?T.red:"transparent",border:"1px solid "+(mType===v?T.red:T.grey2),color:mType===v?T.paper:T.grey3,padding:"4px 10px",fontSize:9,cursor:"pointer",fontFamily:"'Archivo Black',sans-serif",letterSpacing:"0.06em",transition:"all .1s"}}>{l}</button>
            ))}
            {wardrobe.length>0&&<button onClick={()=>setMySizeOnly(x=>!x)} style={{background:mySizeOnly?T.ink:"transparent",border:"1px solid "+(mySizeOnly?T.ink:T.grey2),color:mySizeOnly?T.paper:T.grey3,padding:"4px 10px",fontSize:9,cursor:"pointer",fontFamily:"'Archivo Black',sans-serif",letterSpacing:"0.06em",transition:"all .1s",marginLeft:"auto"}}>MY SIZE</button>}
          </div>
          <BundleCreator myListings={listings.filter(l=>l.user==="me")} onBundle={createBundle}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,padding:"12px 12px 20px"}}>
            {filtered.length>0?filtered.map(l=><ListingCard key={l.id} listing={l} onOpen={setSelL}/>):(<div style={{gridColumn:"1/-1",padding:"40px 20px",textAlign:"center"}}><div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:22,color:T.grey1,lineHeight:.9,marginBottom:10}}>NO RESULTS.</div><div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey3,marginBottom:12}}>{mSearch?"No results for that search":"No listings here yet."}</div>{mSearch&&<button onClick={function(){setMSearch("");}} style={{background:"none",border:"2px solid "+T.ink,color:T.ink,padding:"7px 16px",fontFamily:"'Archivo Black',sans-serif",fontSize:9,letterSpacing:"0.1em",cursor:"pointer"}}>CLEAR SEARCH</button>}</div>)}
          </div>
        </Blade>

        {/* WARDROBE */}
        <Blade active={tab==="Wardrobe"}>
          <div style={{padding:"20px 16px 12px",borderBottom:`2px solid ${T.ink}`,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:40,lineHeight:.85,color:T.ink,letterSpacing:"-0.03em"}}>
              MY<br/>CLO<br/>SET<span style={{color:T.yellow}}>.</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
              {wardrobe.length>0&&<Btn variant="ghost" style={{padding:"5px 10px",fontSize:8}} onClick={()=>setShowOB(true)}>OUTFIT{outfit.length>0?` (${outfit.length})`:""}</Btn>}
              <Btn variant="ghost" style={{padding:"5px 10px",fontSize:8}} onClick={()=>setShowScan(true)}>SCAN</Btn>
              <Btn style={{padding:"5px 10px",fontSize:8}} onClick={()=>setShowAW(true)}>+ ADD</Btn>
            </div>
          </div>
          {/* wardrobe sub-section tabs */}
          <div style={{display:"flex",borderBottom:`2px solid ${T.ink}`,position:"sticky",top:0,zIndex:10}}>
            {[["CLOSET","wardrobe"],["ARCHIVE","archive"],["SUGGEST","suggest"],["STATS","stats"],["FORGOTTEN","forgotten"],["ZINE","zine"]].map(([l,v])=>(
              <button key={v} onClick={()=>setActiveSection(v)} style={{flex:1,background:activeSection===v?T.ink:"transparent",border:"none",borderRight:`1px solid ${T.grey1}`,color:activeSection===v?T.paper:T.grey3,padding:"9px 4px",fontSize:7,cursor:"pointer",fontFamily:"'Archivo Black',sans-serif",letterSpacing:"0.08em",transition:"all .12s"}}>{l}</button>
            ))}
          </div>
          {activeSection==="stats"&&<WardrobeStats wardrobe={wardrobe}/>}
          {activeSection==="archive"&&<OutfitArchive history={outfitHistory}/>}
          {activeSection==="suggest"&&<OutfitSuggestions posts={posts} wardrobe={wardrobe} onBuildOutfit={items=>{items.forEach(item=>toggleOutfit(item));setShowOB(true);}}/> }
          {activeSection==="forgotten"&&<ForgottenPieces wardrobe={wardrobe} onItem={item=>{setSelW(item);}} onList={listForgotten}/>}
          {activeSection==="taste"&&<TasteProfile posts={posts} wardrobe={wardrobe}/>}
          {activeSection==="zine"&&<ZineSubmission onSubmit={()=>setActiveSection("wardrobe")}/>}
          {activeSection==="wardrobe"&&wardrobe.length>0&&(
            <div style={{display:"flex",borderBottom:`2px solid ${T.ink}`}}>
              {[["ITEMS",wardrobe.length],["WORN TODAY",wardrobe.filter(w=>w.lastWorn==="Today").length],["TOP ITEM",wardrobe.reduce((a,b)=>b.wears>a.wears?b:a,wardrobe[0])?.name?.split(" ")[0]||"-"]].map(([l,v],i)=>(
                <div key={l} style={{flex:1,padding:"10px 12px",borderRight:i<2?`2px solid ${T.ink}`:"none",textAlign:"center"}}>
                  <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:18,color:T.ink,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:8,color:T.grey3,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Courier Prime',monospace",marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
          )}
          {activeSection==="wardrobe"&&(
  <div style={{padding:"8px 14px",borderBottom:"1px solid "+T.grey1,display:"flex",alignItems:"center"}}>
    <input value={wardSearch} onChange={e=>setWardSearch(e.target.value)} placeholder="search your closet..." style={{flex:1,background:"transparent",border:"none",outline:"none",fontFamily:"'Courier Prime',monospace",fontSize:11,color:T.ink}}/>
    {wardSearch&&<button onClick={()=>setWardSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:T.grey3,fontSize:14,lineHeight:1,padding:0}}>{"×"}</button>}
  </div>
)}
{activeSection==="wardrobe"&&<>{/* Theme suggestions panel */}
          {wardrobe.length>0&&(
            <div style={{background:T.wash,borderBottom:`2px solid ${T.ink}`,padding:"12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div>
                  <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:2}}>{todayTheme.issue} . TODAY'S THEME</div>
                  <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:16,color:T.ink,letterSpacing:"0.02em"}}>{todayTheme.name}</div>
                </div>
                <div style={{background:T.ink,padding:"4px 10px"}}>
                  <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.paper,letterSpacing:"0.1em",fontStyle:"italic"}}>{todayTheme.directive}</span>
                </div>
              </div>
              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey3,lineHeight:1.7,marginBottom:10}}>{todayTheme.editorial}</div>
              {wardrobe.filter(item=>todayTheme.matchFn(item)).length>0?(
                <>
                  <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:9,color:T.grey3,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>SUGGESTED FOR TODAY</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {wardrobe.filter(item=>todayTheme.matchFn(item)).slice(0,3).map(item=>(
                      <div key={item.id} style={{display:"flex",gap:10,alignItems:"center",background:T.paper,border:`2px solid ${T.ink}`,padding:"9px 11px",cursor:"pointer",transition:"box-shadow .1s",boxShadow:`3px 3px 0 ${T.ink}`}}
                        onClick={()=>setSelW(item)}>
                        <div style={{width:32,height:32,background:T.wash,border:`1px solid ${T.grey1}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <ClothingShape category={item.cat} size={22}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div>
                          <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>{item.brand&&item.brand+" . "}{item.cat}</div>
                        </div>
                        <div style={{maxWidth:130,textAlign:"right",flexShrink:0}}>
                          <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3,lineHeight:1.5,fontStyle:"italic"}}>{todayTheme.whyFn(item)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:10,display:"flex",gap:8}}>
                    <button onClick={()=>setShowNP(true)} style={{flex:1,background:T.ink,border:"none",color:T.paper,padding:"9px 12px",fontFamily:"'Archivo Black',sans-serif",fontSize:9,letterSpacing:"0.1em",cursor:"pointer",textTransform:"uppercase",boxShadow:`3px 3px 0 ${T.red}`}}>POST TODAY'S FIT -></button>
                  </div>
                </>
              ):(
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey3,fontStyle:"italic",borderTop:`1px solid ${T.grey1}`,paddingTop:8}}>Add more items to get personalised suggestions for today's theme.</div>
              )}
            </div>
          )}
          {wardrobe.length===0?(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"55vh",gap:16,padding:24,textAlign:"center"}}>
              <ClothingShape category="Tops" size={80}/>
              <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:16,color:T.ink,letterSpacing:"0.02em"}}>CLOSET IS EMPTY.</div>
              <div style={{fontSize:11,color:T.grey3,lineHeight:1.7,fontFamily:"'Courier Prime',monospace"}}>Scan clothing with your camera<br/>or add items manually.</div>
              <div style={{display:"flex",gap:10}}>
                <Btn variant="ghost" onClick={()=>setShowScan(true)}>SCAN</Btn>
                <Btn onClick={()=>setShowAW(true)}>ADD ITEM</Btn>
              </div>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
              {wardrobe.map((item,idx)=>{
                const inOutfit=!!outfit.find(i=>i.id===item.id);
                return (
                  <div key={item.id} onClick={()=>setSelW(item)} style={{background:inOutfit?T.ink:T.paper,border:"none",borderRight:idx%2===0?`1px solid ${T.grey1}`:"none",borderBottom:`1px solid ${T.grey1}`,cursor:"pointer",overflow:"hidden",transition:"background .12s"}}>
                    <div style={{position:"relative"}}>
                      <ItemPhoto img={item.img||null} category={item.cat} brand={item.brand} height={130} small/>
                      {inOutfit&&<div style={{position:"absolute",top:7,right:7,background:T.red,color:T.paper,width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:"'Archivo Black',sans-serif"}}>v</div>}
                      {item.wears>0&&<div style={{position:"absolute",bottom:5,right:7,fontSize:9,color:T.grey3,fontFamily:"'Courier Prime',monospace"}}>{item.wears}x</div>}
                    </div>
                    <div style={{padding:"8px 10px 10px",background:inOutfit?T.ink:T.paper,borderTop:`1px solid ${T.grey1}`}}>
                      <div style={{fontFamily:"'Courier Prime',monospace",fontWeight:700,fontSize:9,color:inOutfit?T.grey2:T.grey3,textTransform:"uppercase",marginBottom:2,letterSpacing:"0.1em"}}>{item.cat}</div>
                      <div style={{fontSize:11,color:inOutfit?T.paper:T.ink,marginBottom:2,fontFamily:"'Archivo Black',sans-serif",letterSpacing:"0.01em"}}>{item.name}</div>
                      <div style={{fontSize:9,color:inOutfit?T.grey2:T.grey3,fontFamily:"'Courier Prime',monospace"}}>{item.brand&&item.brand+" . "}sz {item.size}</div>
                      <div style={{fontSize:8,color:inOutfit?T.grey3:T.grey2,marginTop:3,fontFamily:"'Courier Prime',monospace"}}>{item.lastWorn&&item.lastWorn!=="Never"?item.lastWorn:"never worn"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </>}{/* end wardrobe section */}
        </Blade>

        {/* PROFILE */}
        <Blade active={tab==="Profile"}>
          <ProfileView uid={profUid} posts={posts} listings={listings} onDM={()=>setShowDM(true)} following={following} onFollow={toggleFollow} onToggleShop={toggleShop} saved={saved} soldItems={soldItems} onEditProfile={()=>{setEditDraft({...meUser});setShowEditProfile(true);}} onReport={uid=>reportItem(uid,"spam")} onBlock={blockUser} ratings={ratings} onRate={rateUser} onUser={uid=>{setProfUid(uid);setTab("Profile");}}/>
        </Blade>
      </main>

      {/* -- BOTTOM NAV - cut-out band -- */}
      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"min(480px,100%)",background:T.paper,borderTop:`3px solid ${T.ink}`,display:"flex",zIndex:50,boxShadow:`0 -4px 0 0 ${T.ink}`}}>
        {NAV.map((item)=>{
          const active=tab===item.id;
          return (
            <button key={item.id} onClick={()=>{setTab(item.id);if(item.id==="Profile")setProfUid("me");}} className="action-btn" style={{flex:1,background:active?T.ink:"transparent",border:"none",cursor:"pointer",padding:"10px 4px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"inherit",transition:"background .12s",borderRight:item.id!=="Profile"?`1px solid ${T.grey1}`:"none",WebkitTapHighlightColor:"transparent"}}>
              <span style={{fontSize:12,color:active?T.paper:T.grey3,fontFamily:item.icon==="$"?"'Archivo Black',sans-serif":"'Courier Prime',monospace",transition:"color .12s"}}>{item.icon}</span>
              <span style={{fontSize:7,color:active?T.grey2:T.grey3,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Archivo Black',sans-serif",transition:"color .12s"}}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* -- OVERLAYS -- */}
      {showGlobalSearch&&<GlobalSearch posts={posts} listings={listings} onClose={()=>setShowGlobalSearch(false)} onUser={uid=>{setProfUid(uid);setTab("Profile");}} onListing={setSelL} setProfUid={setProfUid} setTab={setTab}/>}
      {tagPage&&<TagPage tag={tagPage} posts={posts} onClose={()=>setTagPage(null)} onUser={uid=>{setProfUid(uid);setTab("Profile");setTagPage(null);}} onLike={like} setPosts={setPosts} onShare={item=>setShowShare({item,type:"post"})} onNotify={n=>{if(n.user&&n.user!=="me")setNotifs(ns=>[{id:"nn"+Date.now(),type:n.type,user:n.user,text:n.text||n.type,time:"now",read:false},...ns].slice(0,50));}}/> }
      {showEditProfile&&editDraft&&(
        <div style={{position:"fixed",inset:0,background:"rgba(13,13,13,.7)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowEditProfile(false)}>
          <div style={{background:T.paper,border:"3px solid "+T.ink,boxShadow:"8px 8px 0 "+T.ink,width:"min(480px,100%)",maxHeight:"90vh",overflow:"auto",animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
            <MHdr title="EDIT PROFILE" onC={()=>setShowEditProfile(false)} inv={true}/>
            <div style={{padding:20,display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:4}}>
                <UserAvatar name={editDraft.name||"?"} size={72} highlight={true}/>
              </div>
              <div><div style={{fontSize:9,color:T.grey3,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:6,fontFamily:"'Courier Prime',monospace",fontWeight:700}}>Full Name</div>
                <input style={{background:T.wash,border:"2px solid "+T.grey2,borderLeft:"2px solid "+T.ink,color:T.ink,padding:"9px 12px",fontSize:13,fontFamily:"'Courier Prime',monospace",outline:"none",width:"100%",boxSizing:"border-box"}} value={editDraft.name||""} onChange={e=>setEditDraft(d=>({...d,name:e.target.value}))}/>
              </div>
              <div><div style={{fontSize:9,color:T.grey3,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:6,fontFamily:"'Courier Prime',monospace",fontWeight:700}}>Username</div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontFamily:"'Courier Prime',monospace",fontSize:13,color:T.grey3}}>@</span>
                  <input style={{background:T.wash,border:"2px solid "+T.grey2,borderLeft:"2px solid "+T.ink,color:T.ink,padding:"9px 12px 9px 28px",fontSize:13,fontFamily:"'Courier Prime',monospace",outline:"none",width:"100%",boxSizing:"border-box"}} value={editDraft.handle||""} onChange={e=>setEditDraft(d=>({...d,handle:e.target.value.replace(/\s/g,"").toLowerCase()}))}/>
                </div>
              </div>
              <div><div style={{fontSize:9,color:T.grey3,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:6,fontFamily:"'Courier Prime',monospace",fontWeight:700}}>Bio</div>
                <textarea style={{background:T.wash,border:"2px solid "+T.grey2,borderLeft:"2px solid "+T.ink,color:T.ink,padding:"9px 12px",fontSize:12,fontFamily:"'Courier Prime',monospace",outline:"none",width:"100%",boxSizing:"border-box",resize:"none",height:72,lineHeight:1.6}} value={editDraft.bio||""} onChange={e=>setEditDraft(d=>({...d,bio:e.target.value}))}/>
              </div>
              <div><div style={{fontSize:9,color:T.grey3,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:8,fontFamily:"'Courier Prime',monospace",fontWeight:700}}>Style Tags</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {STYLE_TAGS.map(s=>{
                    var sel=(editDraft.styles||[]).includes(s);
                    return <button key={s} onClick={()=>setEditDraft(d=>({...d,styles:sel?(d.styles||[]).filter(x=>x!==s):[...(d.styles||[]),s]}))} style={{background:sel?T.ink:"transparent",color:sel?T.paper:T.ink,border:"2px solid "+(sel?T.ink:T.grey1),padding:"6px 12px",fontSize:10,cursor:"pointer",fontFamily:"'Archivo Black',sans-serif",letterSpacing:"0.06em",textTransform:"uppercase",transition:"all .12s"}}>{s}</button>;
                  })}
                </div>
              </div>
              <Btn onClick={()=>{setMeUser(u=>({...u,...editDraft}));setShowEditProfile(false);}} style={{marginTop:4}}>SAVE CHANGES</Btn>
            </div>
          </div>
        </div>
      )}
      {showUserSearch&&<UserSearchOverlay onClose={function(){setShowUserSearch(false);}} onUser={function(uid){setProfUid(uid);setTab("Profile");setShowUserSearch(false);}}/> }
      {selL&&<ListingModal listing={selL} onClose={()=>setSelL(null)} onShare={item=>setShowShare({item,type:"listing"})} onDM={()=>{setSelL(null);setShowDM(true);}} onNotify={addMarketNotif} watched={watched} onWatch={toggleWatch} onSold={markSold} onUpdateOffers={(offers)=>setListings(ls=>ls.map(l=>l.id===selL.id?{...l,offers}:l))}/>}
      {showScan&&<Scanner onClose={()=>setShowScan(false)} onResult={scanResult}/>}
      {showDM&&<DMPanel dms={dms} setDms={setDms} onClose={()=>setShowDM(false)}/>}
      {showNotifs&&<NotifPanel notifs={notifs} onClose={()=>setShowNotifs(false)} onMarkAll={markAllRead}/>}
      {showShare&&<ShareModal item={showShare.item} type={showShare.type} onClose={()=>setShowShare(null)}/>}

      {/* Wardrobe Detail */}
      {selW&&(
        <div style={MOV} onClick={()=>setSelW(null)}>
          <div style={MBX()} onClick={e=>e.stopPropagation()}>
            <MHdr title="ITEM DETAIL" onC={()=>setSelW(null)} inv={true}/>
            <div style={{overflowY:"auto"}}>
              <ItemPhoto img={selW.img||null} category={selW.cat} brand={selW.brand} height={200}/>
              <div style={{padding:18,display:"flex",flexDirection:"column",gap:12}}>
                <div style={{fontFamily:"'Courier Prime',monospace",fontWeight:700,fontSize:9,color:T.grey3,textTransform:"uppercase",letterSpacing:"0.14em"}}>{selW.cat}</div>
                <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:20,color:T.ink,letterSpacing:"0.01em"}}>{selW.name}</div>
                {selW.brand&&<div style={{fontSize:11,color:T.grey3,fontFamily:"'Courier Prime',monospace"}}>{selW.brand} . size {selW.size}</div>}
                <div style={{display:"flex",gap:8}}>
                  <CostPerWear item={selW}/>
                  {[["TIMES WORN",selW.wears],["LAST WORN",selW.lastWorn||"Never"],["PAID",selW.pricePaid?"$"+selW.pricePaid:"-"]].map(([k,v])=>(
                    <div key={k} style={{flex:1,background:T.wash,border:`2px solid ${T.ink}`,padding:"9px 12px"}}>
                      <div style={LBL}>{k}</div>
                      <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:18,color:T.ink}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                  {[["Size",selW.size],["Material",selW.mat],["Chest",selW.chest?selW.chest+'"':null],["Waist",selW.waist?selW.waist+'"':null],["Hips",selW.hips?selW.hips+'"':null],["Length",selW.len?selW.len+'"':null]].filter(([,v])=>v).map(([k,v])=>(
                    <div key={k} style={{background:T.wash,border:`1px solid ${T.grey1}`,padding:"7px 9px"}}>
                      <div style={LBL}>{k}</div>
                      <div style={{fontSize:12,color:T.ink,fontFamily:"'Courier Prime',monospace"}}>{v}</div>
                    </div>
                  ))}
                </div>
                {selW.notes&&<div style={{fontSize:11,color:T.grey3,fontStyle:"italic",fontFamily:"'Courier Prime',monospace"}}>{selW.notes}</div>}
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <Btn variant="ghost" style={{flex:1}} onClick={()=>{markWorn(selW.id);setSelW(null);}}>MARK WORN</Btn>
                  <Btn variant={outfit.find(i=>i.id===selW.id)?"primary":"outline"} style={{flex:1}} onClick={()=>{toggleOutfit(selW);setSelW(null);}}>{outfit.find(i=>i.id===selW.id)?"REMOVE":"+ OUTFIT"}</Btn>
                  <Btn variant="ghost" style={{color:T.red,borderColor:T.red,padding:"9px 12px"}} onClick={()=>{setWardrobe(w=>w.filter(i=>i.id!==selW.id));setSelW(null);}}>{"×"}</Btn>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outfit Builder */}
      {showOB&&(
        <div style={MOV} onClick={()=>setShowOB(false)}>
          <div style={MBX()} onClick={e=>e.stopPropagation()}>
            <MHdr title="TODAY'S FIT" onC={()=>setShowOB(false)} inv={true}/>
            <div style={{overflowY:"auto"}}>
              {outfit.length===0
                ?(
                  <div style={{padding:"40px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:16,textAlign:"center"}}>
                    <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:32,color:T.g1,lineHeight:.9,letterSpacing:"-0.02em"}}>NO<br/>PIECES<br/>YET<span style={{color:T.yellow}}>.</span></div>
                    <div style={{fontFamily:"'Courier Prime',monospace",fontSize:10,color:T.grey3,lineHeight:1.8,maxWidth:240}}>Go to your closet and tap items to add them to today's outfit.</div>
                    <button onClick={()=>setShowOB(false)} style={{background:"none",border:`2px solid ${T.ink}`,color:T.ink,padding:"10px 20px",fontFamily:"'Archivo Black',sans-serif",fontSize:9,letterSpacing:"0.12em",cursor:"pointer",marginTop:4}}>OPEN CLOSET {"→"}</button>
                  </div>
                ):(
                  <>
                    {/* editorial issue header */}
                    <div style={{background:T.ink,padding:"16px 18px 14px",borderBottom:`2px solid ${T.ink}`}}>
                      <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.2em",marginBottom:4}}>
                        {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}).toUpperCase()}
                      </div>
                      <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:20,color:T.paper,letterSpacing:"0.02em",lineHeight:1}}>
                        TODAY'S FIT <span style={{color:T.yellow}}>.</span> {outfit.length} {outfit.length===1?"PIECE":"PIECES"}
                      </div>
                    </div>

                    {/* flat-lay grid - editorial magazine layout */}
                    <div style={{padding:"16px 16px 0"}}>
                      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(outfit.length,3)},1fr)`,gap:8}}>
                        {outfit.map((item,i)=>(
                          <div key={item.id} style={{position:"relative",background:T.wash,border:`2px solid ${T.ink}`,overflow:"hidden",boxShadow:`3px 3px 0 ${T.ink}`,gridColumn:outfit.length===1?"1/-1":undefined}}>
                            <ItemPhoto img={item.img||null} category={item.cat} brand="" height={outfit.length===1?200:110} small={outfit.length>1}/>
                            {/* remove button overlay */}
                            <button onClick={()=>toggleOutfit(item)} style={{position:"absolute",top:6,right:6,background:T.ink,border:"none",color:T.paper,width:20,height:20,cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Archivo Black',sans-serif",opacity:.8}}>{"×"}</button>
                            <div style={{padding:"6px 8px 8px",borderTop:`1px solid ${T.g1}`}}>
                              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:1}}>{item.cat}</div>
                              <div style={{fontSize:9,color:T.ink,fontFamily:"'Archivo Black',sans-serif",lineHeight:1.2,letterSpacing:"0.01em"}}>{item.name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* item list - editorial rundown */}
                    <div style={{margin:"16px 16px 0",border:`2px solid ${T.ink}`}}>
                      <div style={{background:T.ink,padding:"6px 12px"}}>
                        <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:8,color:T.paper,letterSpacing:"0.14em"}}>THE RUNDOWN</span>
                      </div>
                      {outfit.map((item,i)=>(
                        <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderTop:i>0?`1px solid ${T.g1}`:"none",background:i%2===0?T.paper:T.wash}}>
                          <span style={{fontFamily:"'Rubik Dirt',sans-serif",fontSize:9,color:T.yellow,flexShrink:0,width:16,textAlign:"right"}}>{String(i+1).padStart(2,"0")}</span>
                          <ClothingShape category={item.cat} size={18}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:"'Archivo Black',sans-serif",fontSize:10,color:T.ink,letterSpacing:"0.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                            <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>{item.brand&&item.brand+" . "}sz {item.size}</div>
                          </div>
                          {item.pricePaid&&<span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,flexShrink:0}}>${item.pricePaid}</span>}
                        </div>
                      ))}
                    </div>

                    {/* outfit cost breakdown */}
                    {outfit.length>0&&(
                      <div style={{margin:"12px 16px 0",border:"1px solid "+T.grey1,overflow:"hidden"}}>
                        <div style={{background:T.wash,padding:"8px 12px",borderBottom:"1px solid "+T.grey1,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.1em"}}>OUTFIT COST BREAKDOWN</span>
                          <span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:14,color:T.ink}}>${outfit.reduce((s,i)=>s+(parseFloat(i.pricePaid)||0),0).toFixed(0)}</span>
                        </div>
                        {outfit.map(item=>(
                          <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 12px",borderBottom:"1px solid "+T.grey1}}>
                            <div style={{minWidth:0}}>
                              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                              <div style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3}}>{item.cat}{item.brand?" · "+item.brand:""}</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                              {item.pricePaid?<span style={{fontFamily:"'Archivo Black',sans-serif",fontSize:12,color:T.ink}}>${parseFloat(item.pricePaid).toFixed(0)}</span>:<span style={{fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.grey3}}>--</span>}
                              {item.pricePaid&&item.wears>0&&<div style={{fontFamily:"'Courier Prime',monospace",fontSize:7,color:T.grey3}}>${(item.pricePaid/item.wears).toFixed(2)}/wear</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* actions */}
                    <div style={{padding:"16px 16px 20px",display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>
                      <Btn variant="ghost" style={{flex:1}} onClick={()=>{setOutfitHistory(h=>[{id:"oh"+Date.now(),date:new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}),items:[...outfit],saved:true},...h].slice(0,30));setShowOB(false);}}>{"♡"} SAVE FIT</Btn>
                      <Btn style={{flex:1}} onClick={()=>{outfit.forEach(item=>markWorn(item.id));setOutfitHistory(h=>[{id:"oh"+Date.now(),date:new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}),items:[...outfit]},...h].slice(0,30));setShowOB(false);}}>{"✓"} WORE IT TODAY</Btn>
                      <Btn variant="ghost" style={{flex:"0 0 100%"}} onClick={()=>{setNp(p=>({...p,items:outfit.map(i=>i.id),cat:outfit[0]?outfit[0].cat:"Tops",caption:p.caption||"Today's fit. "}));setShowOB(false);setShowNP(true);}}>POST FIT {"→"}</Btn>
                    </div>
                  </>
                )
              }
            </div>
          </div>
        </div>
      )}

      {/* New Post */}
      {showNP&&(
        <div style={MOV} onClick={()=>setShowNP(false)}>
          <div style={MBX()} onClick={e=>e.stopPropagation()}>
            <MHdr title="NEW POST" onC={()=>setShowNP(false)} inv={true}/>
            <div style={{padding:18,overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
              <ImageUpload value={np.img} onChange={img=>setNp(p=>({...p,img}))} height={175} label="ATTACH MAIN PHOTO"/>
              {np.imgs.length>0&&(
                <div style={{display:"flex",gap:6,overflowX:"auto"}}>
                  {np.imgs.map((im,i)=>(
                    <div key={i} style={{position:"relative",flexShrink:0}}>
                      <div style={{width:70,height:70,background:T.wash,border:"1px solid "+T.grey1,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>IMG {i+2}</div>
                      <button onClick={()=>setNp(p=>({...p,imgs:p.imgs.filter((_,j)=>j!==i)}))} style={{position:"absolute",top:-4,right:-4,background:T.ink,border:"none",color:T.paper,width:14,height:14,cursor:"pointer",fontSize:9,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>{"×"}</button>
                    </div>
                  ))}
                </div>
              )}
              {np.imgs.length<4&&<button onClick={()=>setNp(p=>({...p,imgs:[...p.imgs,null]}))} style={{background:"none",border:"1px dashed "+T.grey2,color:T.grey3,padding:"6px 12px",fontFamily:"'Courier Prime',monospace",fontSize:9,cursor:"pointer",letterSpacing:"0.08em",alignSelf:"flex-start"}}>+ ADD ANOTHER PHOTO</button>}
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}><div style={LBL}>Category</div><select style={FINP} value={np.cat} onChange={e=>setNp(p=>({...p,cat:e.target.value}))}>{CATS.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}</select></div>
              </div>
              <div><div style={LBL}>Caption</div><textarea style={{...FINP,height:90,resize:"none"}} placeholder="describe the fit..." value={np.caption} onChange={e=>setNp(p=>({...p,caption:e.target.value}))}/></div>
              <div><div style={LBL}>Tags (comma separated)</div><input style={FINP} placeholder="vintage, streetwear, thrift" value={np.tags} onChange={e=>setNp(p=>({...p,tags:e.target.value}))}/></div>
              {wardrobe.length>0&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div style={LBL}>TAG WARDROBE PIECES</div>
                    <button onClick={()=>setShowWardrobePicker(w=>!w)} style={{background:"none",border:"none",color:T.red,fontFamily:"'Courier Prime',monospace",fontSize:8,cursor:"pointer",letterSpacing:"0.08em"}}>{showWardrobePicker?"DONE":"+ ADD PIECES"}</button>
                  </div>
                  {np.items.length>0&&(
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                      {np.items.map(id=>{
                        var item=wardrobe.find(w=>w.id===id);
                        return item?<span key={id} style={{fontFamily:"'Courier Prime',monospace",fontSize:9,border:"1px solid "+T.ink,padding:"2px 8px",color:T.ink,display:"flex",alignItems:"center",gap:5}}>{item.name.split(" ").slice(0,2).join(" ")}<button onClick={()=>setNp(p=>({...p,items:p.items.filter(x=>x!==id)}))} style={{background:"none",border:"none",cursor:"pointer",color:T.grey3,fontSize:10,lineHeight:1,padding:0}}>{"×"}</button></span>:null;
                      })}
                    </div>
                  )}
                  {showWardrobePicker&&(
                    <div style={{maxHeight:140,overflowY:"auto",border:"1px solid "+T.grey1}}>
                      {wardrobe.map(item=>{
                        var sel=np.items.includes(item.id);
                        return (
                          <button key={item.id} onClick={()=>setNp(p=>({...p,items:sel?p.items.filter(x=>x!==item.id):[...p.items,item.id]}))} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:sel?T.wash:"transparent",border:"none",borderBottom:"1px solid "+T.grey1,cursor:"pointer",textAlign:"left"}}>
                            <div style={{width:12,height:12,border:"2px solid "+(sel?T.ink:T.grey1),background:sel?T.ink:"transparent",flexShrink:0}}/>
                            <span style={{flex:1,fontFamily:"'Courier Prime',monospace",fontSize:9,color:T.ink}}>{item.name}</span>
                            <span style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3}}>{item.cat}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              <Btn variant="red" onClick={addPost}>SHARE POST</Btn>
            </div>
          </div>
        </div>
      )}

      {/* New Listing */}
      {showNL&&(
        <div style={MOV} onClick={()=>setShowNL(false)}>
          <div style={MBX()} onClick={e=>e.stopPropagation()}>
            <MHdr title="LIST AN ITEM" onC={()=>setShowNL(false)} inv={true}/>
            <div style={{padding:18,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
              <ImageUpload value={nl.img} onChange={img=>setNl(l=>({...l,img}))} height={140} label="ATTACH PHOTO"/>
              {[["Item Title","title","text","e.g. Levi's 501"],["Brand","brand","text","e.g. Levi's"],["Size","size","text","e.g. M or W32"],["Asking Price ($)","price","number","85"],["Retail Price ($)","retail","number","148"]].map(([lbl,key,type,ph])=>(
                <div key={key}><div style={LBL}>{lbl}</div><input type={type} style={FINP} placeholder={ph} value={nl[key]} onChange={e=>setNl(l=>({...l,[key]:e.target.value}))}/></div>
              ))}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["Category","cat",CATS.filter(c=>c!=="All")],["Condition","cond",CONDS]].map(([lbl,key,opts])=>(
                  <div key={key}><div style={LBL}>{lbl}</div><select style={FINP} value={nl[key]} onChange={e=>setNl(l=>({...l,[key]:e.target.value}))}>{opts.map(o=><option key={o}>{o}</option>)}</select></div>
                ))}
              </div>
              <div><div style={LBL}>Description</div><textarea style={{...FINP,height:65,resize:"none"}} placeholder="fabric, fit, condition details..." value={nl.desc} onChange={e=>setNl(l=>({...l,desc:e.target.value}))}/></div>
              <div>
                <div style={{fontFamily:"'Courier Prime',monospace",fontSize:8,color:T.grey3,letterSpacing:"0.1em",marginBottom:6}}>MEASUREMENTS (optional, inches)</div>
                <div style={{display:"flex",gap:6}}>
                  <div style={{flex:1}}><div style={LBL}>Chest</div><input style={FINP} value={nl.chest||""} onChange={e=>setNl(l=>({...l,chest:e.target.value}))} placeholder="40"/></div>
                  <div style={{flex:1}}><div style={LBL}>Waist</div><input style={FINP} value={nl.waist||""} onChange={e=>setNl(l=>({...l,waist:e.target.value}))} placeholder="32"/></div>
                  <div style={{flex:1}}><div style={LBL}>Hips</div><input style={FINP} value={nl.hips||""} onChange={e=>setNl(l=>({...l,hips:e.target.value}))} placeholder="38"/></div>
                </div>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:11,color:T.grey3,padding:"8px 0",borderTop:`1px solid ${T.grey1}`,fontFamily:"'Courier Prime',monospace"}}>
                <input type="checkbox" checked={nl.auction} onChange={e=>setNl(l=>({...l,auction:e.target.checked}))} style={{accentColor:T.ink,width:14,height:14}}/>
                List as auction
              </label>
              {nl.auction&&<div><div style={LBL}>Duration</div><select style={FINP} value={nl.ends} onChange={e=>setNl(l=>({...l,ends:e.target.value}))}><option value="1d">1 Day</option><option value="3d">3 Days</option><option value="7d">7 Days</option></select></div>}
              <Btn variant="red" onClick={addListing}>PUBLISH LISTING</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Add Wardrobe */}
      {showAW&&(
        <div style={MOV} onClick={()=>setShowAW(false)}>
          <div style={MBX()} onClick={e=>e.stopPropagation()}>
            <MHdr title="ADD TO CLOSET" onC={()=>setShowAW(false)} inv={true}/>
            <div style={{padding:18,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
              <ImageUpload value={ni.img} onChange={img=>setNi(i=>({...i,img}))} height={130} label="ATTACH PHOTO"/>
              <div><div style={LBL}>Item Name *</div><input style={FINP} placeholder="e.g. White Oxford Shirt" value={ni.name} onChange={e=>setNi(i=>({...i,name:e.target.value}))}/></div>
              <div><div style={LBL}>Brand</div><input style={FINP} placeholder="e.g. Uniqlo" value={ni.brand} onChange={e=>setNi(i=>({...i,brand:e.target.value}))}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><div style={LBL}>Category</div><select style={FINP} value={ni.cat} onChange={e=>setNi(i=>({...i,cat:e.target.value}))}>{CATS.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}</select></div>
                <div><div style={LBL}>Size</div><input style={FINP} placeholder="M / W30 / US10" value={ni.size} onChange={e=>setNi(i=>({...i,size:e.target.value}))}/></div>
              </div>
              <div><div style={LBL}>Material</div><input style={FINP} placeholder="100% Cotton" value={ni.mat} onChange={e=>setNi(i=>({...i,mat:e.target.value}))}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                {[["Chest (in)","chest"],["Waist (in)","waist"],["Hips (in)","hips"],["Length (in)","len"],["Inseam (in)","inseam"]].map(([lbl,key])=>(
                  <div key={key}><div style={LBL}>{lbl}</div><input type="number" style={FINP} value={ni[key]||""} onChange={e=>setNi(i=>({...i,[key]:e.target.value}))}/></div>
                ))}
              </div>
              <div><div style={LBL}>Notes</div><textarea style={{...FINP,height:48,resize:"none"}} value={ni.notes} onChange={e=>setNi(i=>({...i,notes:e.target.value}))}/></div>
              <Btn onClick={addWardrobe}>ADD TO CLOSET</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- CSS --- */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Rubik+Dirt&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:#F2EFE9; }
  ::-webkit-scrollbar { width:3px; height:3px; }
  ::-webkit-scrollbar-thumb { background:#A09890; }
  ::-webkit-scrollbar-track { background:#E8E4DC; }
  select option { background:#F2EFE9; color:#0D0D0D; }

  @keyframes bladeIn  { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes marquee  { 0%{transform:translateX(60%)} 100%{transform:translateX(-200%)} }
  @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }

  input:focus, select:focus, textarea:focus {
    border-left-color:#0D0D0D !important;
    border-color:#0D0D0D !important;
    outline: none !important;
  }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }

  button { cursor:pointer; -webkit-tap-highlight-color:transparent; }

  /* Tactile action buttons - press sinks, release springs */
  .action-btn { position:relative; }
  .action-btn:active { transform:scale(0.92) !important; }
  .action-btn:hover { opacity:1 !important; }

  /* Ink texture on primary buttons via pseudo */
  button::after {
    content:"";
    position:absolute;
    inset:0;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='60' height='60' filter='url(%23g)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events:none;
    mix-blend-mode:multiply;
  }

  /* Spring keyframe for OOTD star pop */
  @keyframes starPop { 0%{transform:scale(1)} 40%{transform:scale(1.5) rotate(-8deg)} 70%{transform:scale(0.9) rotate(3deg)} 100%{transform:scale(1.3) rotate(-5deg)} }

  /* Ripple effect on touch */
  @keyframes ripple { from{transform:scale(0);opacity:.3} to{transform:scale(2.5);opacity:0} }
  .ripple-origin { overflow:hidden; }
  .ripple-origin::before {
    content:"";
    position:absolute;
    border-radius:50%;
    width:60px;
    height:60px;
    background:currentColor;
    top:50%; left:50%;
    margin:-30px 0 0 -30px;
    transform:scale(0);
    opacity:0;
    pointer-events:none;
  }
  .ripple-origin:active::before { animation: ripple .35s ease-out forwards; }
`;
export default App;
