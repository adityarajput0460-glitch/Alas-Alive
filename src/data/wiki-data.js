/**
 * ATLAS ALIVE — Offline Survival Wiki
 */

export const WIKI_CATEGORIES = [
  { id: 'first-aid', name: 'First Aid', emoji: '🩹', articleCount: 4 },
  { id: 'water', name: 'Water Safety', emoji: '💧', articleCount: 3 },
  { id: 'shelter', name: 'Shelter', emoji: '🏕️', articleCount: 3 },
  { id: 'fire', name: 'Fire & Heat', emoji: '🔥', articleCount: 2 },
  { id: 'navigation', name: 'Navigation', emoji: '🧭', articleCount: 3 },
  { id: 'signaling', name: 'Signaling', emoji: '📡', articleCount: 2 }
];

export const WIKI_ARTICLES = {
  'first-aid': [
    {
      id: 'bleeding-control', title: 'Controlling Severe Bleeding',
      content: `<h2>Controlling Severe Bleeding</h2>
<div class="warning-box">⚠️ Severe bleeding can be life-threatening within minutes. Act immediately.</div>
<h3>Direct Pressure Method</h3>
<ul>
<li><span class="step-number">1</span> Apply firm, constant pressure directly on the wound using a clean cloth</li>
<li><span class="step-number">2</span> Do NOT remove the cloth if it soaks through — add more layers on top</li>
<li><span class="step-number">3</span> Maintain pressure for at least 15 minutes without checking</li>
<li><span class="step-number">4</span> If on a limb, elevate the injured area above heart level</li>
</ul>
<h3>Tourniquet Application</h3>
<div class="tip-box">💡 A tourniquet is a LAST RESORT for limb wounds when direct pressure fails.</div>
<ul>
<li>Place 2-3 inches above the wound (never on a joint)</li>
<li>Tighten until bleeding stops completely</li>
<li>Note the time of application — write it on the patient's forehead if needed</li>
<li>Do NOT loosen once applied</li>
</ul>`
    },
    {
      id: 'cpr-basics', title: 'CPR — Basic Life Support',
      content: `<h2>CPR — Basic Life Support</h2>
<div class="warning-box">⚠️ Call for help first if possible. Begin CPR if the person is unresponsive and not breathing normally.</div>
<h3>Adult CPR Steps</h3>
<ul>
<li><span class="step-number">1</span> Place the person on their back on a firm surface</li>
<li><span class="step-number">2</span> Place the heel of one hand on the center of the chest</li>
<li><span class="step-number">3</span> Place your other hand on top, fingers interlocked</li>
<li><span class="step-number">4</span> Push hard and fast: at least 2 inches deep, 100-120 compressions per minute</li>
<li><span class="step-number">5</span> After 30 compressions, give 2 rescue breaths (tilt head, lift chin, seal mouth)</li>
<li><span class="step-number">6</span> Continue the 30:2 cycle until help arrives or the person recovers</li>
</ul>
<div class="tip-box">💡 Push to the beat of "Stayin' Alive" by the Bee Gees for the correct rhythm.</div>`
    },
    {
      id: 'fractures', title: 'Treating Fractures & Sprains',
      content: `<h2>Fractures & Sprains</h2>
<h3>Signs of a Fracture</h3>
<ul><li>Intense pain at the injury site</li><li>Swelling, bruising, or deformity</li><li>Inability to move the limb</li><li>Grinding sensation (crepitus)</li></ul>
<h3>Improvised Splinting</h3>
<ul>
<li><span class="step-number">1</span> Immobilize the joints above and below the fracture</li>
<li><span class="step-number">2</span> Use rigid materials: sticks, boards, rolled magazines</li>
<li><span class="step-number">3</span> Pad between the splint and skin</li>
<li><span class="step-number">4</span> Secure with cloth strips, belts, or cordage — firm but not cutting circulation</li>
<li><span class="step-number">5</span> Check fingers/toes for color, warmth, and sensation every 15 minutes</li>
</ul>`
    },
    {
      id: 'burns', title: 'Burn Treatment',
      content: `<h2>Burn Treatment</h2>
<h3>Burn Classification</h3>
<ul><li><strong>1st Degree:</strong> Red, painful (sunburn-like) — treat at home</li><li><strong>2nd Degree:</strong> Blisters, intense pain — seek medical aid</li><li><strong>3rd Degree:</strong> White/charred, numb — life-threatening emergency</li></ul>
<h3>Immediate Treatment</h3>
<ul>
<li><span class="step-number">1</span> Cool under clean running water for 20 minutes (not ice)</li>
<li><span class="step-number">2</span> Remove jewelry and clothing near the burn (before swelling)</li>
<li><span class="step-number">3</span> Cover loosely with a clean, non-stick dressing</li>
<li><span class="step-number">4</span> Do NOT apply butter, toothpaste, or oil</li>
<li><span class="step-number">5</span> Do NOT pop blisters</li>
</ul>`
    }
  ],
  'water': [
    {
      id: 'water-purification', title: 'Water Purification Methods',
      content: `<h2>Water Purification</h2>
<div class="warning-box">⚠️ Untreated water can cause cholera, dysentery, and parasitic infections.</div>
<h3>Boiling (Most Reliable)</h3>
<ul><li>Bring water to a rolling boil for at least 1 minute</li><li>At altitudes above 2000m, boil for 3 minutes</li><li>Let cool naturally — do not add ice</li></ul>
<h3>Chemical Treatment</h3>
<ul><li><strong>Household bleach:</strong> 2 drops per liter, wait 30 minutes</li><li><strong>Iodine tablets:</strong> Follow package directions, wait 30 minutes</li><li>Water should have slight chlorine smell after treatment</li></ul>
<h3>Solar Disinfection (SODIS)</h3>
<ul><li>Fill clear PET bottles with water</li><li>Place in direct sunlight for 6+ hours (2 days if cloudy)</li><li>UV radiation kills most pathogens</li></ul>`
    },
    {
      id: 'water-finding', title: 'Finding Water Sources',
      content: `<h2>Finding Water in the Wild</h2>
<h3>Natural Indicators</h3>
<ul><li>Follow animal tracks — they often lead to water</li><li>Watch bird flight patterns at dawn/dusk</li><li>Green vegetation in dry areas indicates groundwater</li><li>Insects (especially bees) stay within 3-5km of water</li></ul>
<h3>Collection Methods</h3>
<ul><li><strong>Dew collection:</strong> Drag absorbent cloth through grass at dawn</li><li><strong>Rain catchment:</strong> Use any waterproof surface to collect</li><li><strong>Solar still:</strong> Dig hole, place container, cover with clear plastic, weight center</li></ul>`
    },
    {
      id: 'water-storage', title: 'Water Storage & Rationing',
      content: `<h2>Water Storage & Rationing</h2>
<h3>Minimum Requirements</h3>
<ul><li>Survival minimum: 1 liter per day (rest, shade, no exertion)</li><li>Active minimum: 2-3 liters per day</li><li>Hot climate: 4+ liters per day</li></ul>
<h3>Rationing Strategy</h3>
<ul><li>Drink when thirsty — hoarding water in your body is better than in a bottle</li><li>Reduce sweating: rest during midday, work at dawn/dusk</li><li>Breathe through your nose, not mouth</li><li>Avoid alcohol, caffeine, and high-protein foods</li></ul>`
    }
  ],
  'shelter': [
    {
      id: 'emergency-shelter', title: 'Emergency Shelter Construction',
      content: `<h2>Emergency Shelter</h2>
<h3>Priorities</h3>
<p>Shelter is your #1 survival priority in extreme weather. Hypothermia can kill in 3 hours.</p>
<h3>Debris Hut</h3>
<ul>
<li><span class="step-number">1</span> Find a ridgepole — a strong branch about 3m long</li>
<li><span class="step-number">2</span> Prop one end on a stump or rock at waist height</li>
<li><span class="step-number">3</span> Lean sticks against both sides to form a ribcage</li>
<li><span class="step-number">4</span> Pile leaves/debris 1 meter thick over the frame</li>
<li><span class="step-number">5</span> Fill interior with dry leaves for insulation</li>
</ul>`
    },
    {
      id: 'urban-shelter', title: 'Urban Shelter During Crisis',
      content: `<h2>Urban Shelter in Crisis</h2>
<h3>Location Selection</h3>
<ul><li>Avoid damaged structures — aftershocks can cause collapse</li><li>Seek reinforced concrete buildings (parking garages, stairwells)</li><li>Underground spaces offer protection from weather and conflict</li><li>Avoid ground floors in flood-prone areas</li></ul>
<h3>Securing a Space</h3>
<ul><li>Block windows with debris or furniture for insulation and concealment</li><li>Establish two exit routes minimum</li><li>Keep a low profile — avoid visible light at night</li><li>Set up a latrine area away from sleeping/eating zones</li></ul>`
    },
    {
      id: 'insulation', title: 'Staying Warm Without Heat',
      content: `<h2>Staying Warm</h2>
<h3>Body Heat Conservation</h3>
<ul><li>Insulate from the ground — this is where most heat is lost</li><li>Layer clothing: base (wicking), mid (insulating), outer (wind/waterproof)</li><li>Cover your head — 40% of body heat escapes from the head</li><li>Huddle with others — shared body heat is extremely effective</li></ul>`
    }
  ],
  'fire': [
    {
      id: 'fire-starting', title: 'Fire Starting Methods',
      content: `<h2>Starting Fire</h2>
<h3>The Fire Triangle</h3>
<p>Every fire needs: <strong>Fuel</strong> (dry material), <strong>Heat</strong> (ignition source), <strong>Oxygen</strong> (airflow).</p>
<h3>Tinder Bundle</h3>
<p>Start with the smallest, driest materials: cotton, dry grass, birch bark, paper, lint. Build a loose nest.</p>
<h3>Methods</h3>
<ul><li><strong>Matches/Lighter:</strong> Protect flame from wind, light tinder from below</li><li><strong>Ferro rod:</strong> Scrape firmly with knife edge into tinder bundle</li><li><strong>Battery + steel wool:</strong> Touch terminals to fine steel wool</li><li><strong>Magnifying lens:</strong> Focus sunlight on dark tinder (takes patience)</li></ul>`
    },
    {
      id: 'fire-safety', title: 'Fire Safety & Smoke Signals',
      content: `<h2>Fire Safety</h2>
<ul><li>Clear area 3m around fire of all flammable material</li><li>Never leave fire unattended</li><li>Keep water or dirt nearby to extinguish</li><li>Build a fire wall (reflector) to direct heat toward your shelter</li></ul>
<h3>Smoke Signals</h3>
<ul><li>3 fires in a triangle = international distress signal</li><li>Add green vegetation for thick white smoke (visibility)</li><li>Use a blanket to create puffs — 3 puffs = distress</li></ul>`
    }
  ],
  'navigation': [
    {
      id: 'compass-navigation', title: 'Navigation Without GPS',
      content: `<h2>Navigation Without Technology</h2>
<h3>Sun Navigation</h3>
<ul><li>Sun rises in the East, sets in the West (approximately)</li><li><strong>Shadow stick method:</strong> Place a stick upright. Mark shadow tip. Wait 15 min. Mark again. Line between marks = East-West</li></ul>
<h3>Star Navigation</h3>
<ul><li><strong>Northern Hemisphere:</strong> Find Polaris (North Star) via the Big Dipper's pointer stars</li><li><strong>Southern Hemisphere:</strong> Use the Southern Cross — extend the long axis 4.5x to find South</li></ul>
<h3>Natural Indicators</h3>
<ul><li>Moss tends to grow on the north side of trees (Northern Hemisphere)</li><li>Spider webs are often built on the south side of trees</li><li>Snow melts faster on south-facing slopes</li></ul>`
    },
    {
      id: 'map-reading', title: 'Map Reading Basics',
      content: `<h2>Map Reading</h2>
<h3>Key Concepts</h3>
<ul><li><strong>Scale:</strong> 1:50000 means 1cm on map = 500m in real life</li><li><strong>Contour lines:</strong> Close together = steep, far apart = flat</li><li><strong>Grid references:</strong> Read right then up (easting then northing)</li></ul>
<h3>Using ATLAS ALIVE Offline</h3>
<ul><li>Download your regional map pack BEFORE the emergency</li><li>GPS works without internet — your position dot is real</li><li>Use the compass bearing to navigate to POIs even without detailed maps</li></ul>`
    },
    {
      id: 'dead-reckoning', title: 'Dead Reckoning',
      content: `<h2>Dead Reckoning</h2>
<p>When you have no map, track your movement by direction and distance.</p>
<h3>Pace Counting</h3>
<ul><li>Count every other step (usually 60-70 double paces per 100m)</li><li>Calibrate your pace count on known distance first</li><li>Use a bead counter or pebbles to track hundreds of meters</li></ul>`
    }
  ],
  'signaling': [
    {
      id: 'distress-signals', title: 'International Distress Signals',
      content: `<h2>Distress Signals</h2>
<h3>Universal Signals</h3>
<ul><li><strong>SOS:</strong> 3 short, 3 long, 3 short (light, sound, or any medium)</li><li><strong>3 of anything:</strong> 3 fires, 3 whistle blasts, 3 shots = distress</li><li><strong>Ground-to-air:</strong> Large "X" = need help, "V" = need assistance, "→" = traveling this direction</li></ul>
<h3>Signal Mirror</h3>
<ul><li>Can be seen up to 50km away in clear conditions</li><li>Any reflective surface works: phone screen, CD, foil</li><li>Aim reflected light by sighting through a hole in the mirror toward the target</li></ul>`
    },
    {
      id: 'emergency-comms', title: 'Emergency Communications',
      content: `<h2>Emergency Communications</h2>
<h3>Radio</h3>
<ul><li>Channel 16 (156.8 MHz) = International maritime distress</li><li>Channel 9 on CB radio = emergency channel</li><li>FRS/GMRS radios: Channel 1, CTCSS code 141.3</li></ul>
<h3>ATLAS ALIVE Mesh Mode</h3>
<ul><li>When available, use the Mesh Networking feature to connect with nearby ATLAS users</li><li>Share your location and status with others in range</li><li>Broadcast SOS to all connected peers</li></ul>`
    }
  ]
};
