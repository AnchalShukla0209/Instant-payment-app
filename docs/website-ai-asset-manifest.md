# Instant Payment Website — AI Asset Manifest

Status: Step 3 complete

Generation method: OpenAI built-in image generation tool.

All subjects are fictional. The ambassador was explicitly designed not to resemble a celebrity, politician, public figure or known businessperson.

## Identity lock

The Instant Payment fictional ambassador is defined as:

- Indian male fintech professional, approximately 34
- Medium warm-brown complexion and oval face
- Short, neatly styled black hair
- Clean-shaven with subtle rimless rectangular glasses
- Deep navy suit, white shirt, burnt-orange tie and cyan pocket square
- Calm, confident and approachable expression
- Cyan and orange rim lighting where the scene is cinematic

Future generations must use the high-resolution source `design-assets/ai-sources/ambassador-master.png` as the identity reference and explicitly preserve the face, glasses, hair, age, complexion and wardrobe language.

## Production assets

### 1. `fintech-network-hero.webp`

**Section:** Main homepage hero

**Prompt summary:** Futuristic Indian digital-payments network with a central rupee payment hub, mobile, card, bank and security objects; dark navy cinematic 3D style; visual concentrated on the right with left-side copy space; cyan and orange lighting; no text or logos.

### 2. `ambassador-master.webp`

**Section:** Identity reference; optional leadership/ambassador card

**Prompt summary:** Fictional Indian fintech ambassador in a navy suit with orange tie and cyan accent; waist-up, folded arms, corporate campaign lighting; one person; no real-person likeness, text, logo or watermark.

**Note:** The generated master has a dark studio background rather than true transparency. Use it on dark surfaces or process a background-extracted version before use on a light surface.

### 3. `ambassador-retail-partner.webp`

**Section:** About, retailer opportunity or assisted-services story

**Prompt summary:** Identity-preserving ambassador guiding an Indian shop owner using a tablet inside a premium assisted-finance retail service centre; people on left/centre and clean right-side copy space; welcoming blue/cyan/orange environment; no readable text or logos.

### 4. `ambassador-india-network.webp`

**Section:** Why Choose Us / national partner network

**Prompt summary:** Identity-preserving ambassador on the right with a cinematic India-wide connected retailer network behind him; cyan nodes and orange payment paths; left-side headline space; premium dark fintech campaign style.

### 5. `security-infrastructure.webp`

**Section:** Security and platform trust

**Prompt summary:** Futuristic secure transaction core with shield, biometric rings, encrypted streams, monitoring nodes and server infrastructure; right-weighted dark composition with left copy space; cyan and restrained orange lighting; no text, logos or people.

### 6. `connected-services-ecosystem.webp`

**Section:** Connected product ecosystem / services suite

**Prompt summary:** Bright premium 3D ecosystem with a central tablet dashboard connected to modules for biometric services, money transfer, bills, recharge, card terminal and protection; blue/cyan/orange palette; left-side copy space; no text, logos or people.

## Cropping and implementation rules

- Use `object-fit: cover` with explicit focal positions per breakpoint.
- Ambassador faces must remain fully visible at every breakpoint.
- Do not place HTML text over a face or high-detail technology core.
- Dark assets should retain a solid navy fallback background.
- Use empty alt text only when an image is decorative; otherwise describe the scene and its purpose.
- Large PNG assets must be converted to responsive WebP/AVIF variants during the implementation/performance phase.
- Keep original PNG sources for future crops and higher-resolution exports.

## Approved section mapping

| Website section | Primary asset |
|---|---|
| Hero | `fintech-network-hero.webp` |
| About / retailer story | `ambassador-retail-partner.webp` |
| Product ecosystem | `connected-services-ecosystem.webp` |
| Security | `security-infrastructure.webp` |
| Why Choose Us | `ambassador-india-network.webp` |
| Ambassador profile | `ambassador-master.webp` |

## Step 3 acceptance criteria

- Fictional ambassador master identity created
- Two derived scenes preserve the same identity
- People-led and people-less visuals are balanced
- Six total production visuals available including the existing hero
- Every final asset is saved inside the project
- Prompt and section mapping documented
- Celebrity and public-figure likeness avoided
