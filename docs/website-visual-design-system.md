# Instant Payment Website — Visual Design System & Wireframe

Status: Step 2 complete

## 1. Creative direction

The visual language will combine a premium Indian fintech aesthetic with Instant Payment's existing blue and orange identity. The result should feel technology-led, secure, inclusive and energetic without copying BankU's purple brand system.

Design principles:

1. Dark cinematic storytelling for hero, security and infrastructure sections
2. Warm light surfaces for information-heavy service and company sections
3. Blue/cyan for trust, technology and navigation
4. Orange for conversion actions, active accents and growth
5. Large editorial typography paired with compact product details
6. Real depth through layered grids, glows, glass surfaces and overlapping cards
7. One consistent ambassador identity across people-led visual sections

## 2. Brand colour tokens

### Core

- `IP Navy 950` — `#031326`: footer and maximum-contrast surfaces
- `IP Navy 900` — `#061A34`: hero and security backgrounds
- `IP Navy 800` — `#0A2545`: dark cards and secondary dark surfaces
- `IP Blue 700` — `#07668F`: primary brand blue
- `IP Cyan 500` — `#08A4C4`: technology glow and active state
- `IP Cyan 300` — `#71D5E9`: dark-surface eyebrow text
- `IP Orange 500` — `#F39A1F`: primary conversion accent
- `IP Orange 600` — `#EF6B1B`: CTA gradient endpoint

### Neutral

- `Ink 900` — `#0B1C31`: primary text
- `Slate 600` — `#607089`: supporting text
- `Line 200` — `#DCE8EF`: light borders
- `Canvas 100` — `#F3F9FB`: alternate light section
- `White` — `#FFFFFF`: cards and high-contrast text

### Approved gradients

- Technology: `linear-gradient(120deg, #07668F, #08A4C4)`
- Conversion: `linear-gradient(115deg, #F39A1F, #EF6B1B)`
- Hero: `linear-gradient(120deg, #031326, #061A34 55%, #083A5D)`
- Editorial text: `linear-gradient(100deg, #08B7D4, #F3A01E)`

Orange is reserved for calls to action, conversion indicators and selected highlights. It must not become a general card colour.

## 3. Typography

Primary family: **Inter**

Recommended hierarchy:

- Display XL: 72–80 px desktop / 44–50 px mobile, 800 weight
- Display L: 52–60 px desktop / 36–42 px mobile, 800 weight
- Section title: 38–46 px desktop / 30–36 px mobile, 750–800 weight
- Card title: 18–24 px, 700–750 weight
- Body large: 16–18 px, 400–500 weight
- Body: 14–16 px, 400 weight
- Label/eyebrow: 11–12 px, uppercase, 750–800 weight, 0.12–0.16 em tracking

Headings use tight negative letter spacing. Paragraph width should remain between 48 and 68 characters for comfortable reading.

## 4. Grid and spacing

- Desktop content width: 1180–1220 px
- Tablet content padding: 28–36 px
- Mobile content padding: 18–22 px
- Desktop section spacing: 104–128 px
- Mobile section spacing: 72–88 px
- Main grid: 12 columns desktop, 6 columns tablet, 4 columns mobile
- Standard card gap: 16–20 px
- Editorial two-column gap: 64–96 px

Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96, 120 px.

## 5. Surfaces and cards

### Light card

- White to very-light-cyan gradient
- 1 px `Line 200` border
- 18–24 px radius
- Soft shadow only on hover or elevated layouts

### Dark glass card

- White at 5–9% opacity
- White border at 12–18% opacity
- 14–20 px backdrop blur
- Used only over navy imagery or gradients

### Floating proof card

- White surface
- 12–16 px radius
- Strong, soft navy shadow
- One icon, one bold phrase and one supporting line

### Compliance card

- Warm white surface
- Visible badge/logo area
- No compliance mark without approval

## 6. Buttons and links

### Primary CTA

- Orange gradient
- White text
- 50–54 px height
- 12–14 px radius
- Right-arrow movement on hover

### Secondary CTA

- Blue/cyan gradient
- White text
- Used for login and product actions

### Dark-surface ghost CTA

- Transparent white 5–7%
- White 25% border
- White text

### Text link

- Brand blue on light surface
- Cyan on dark surface
- Arrow shifts 4 px on hover

## 7. Iconography

- Bootstrap Icons for UI and service symbols
- Rounded-square icon containers
- Blue/cyan icons for technology and security
- Orange icons for payments, growth and active steps
- Avoid mixing multiple icon families
- Avoid oversized decorative icons inside content cards

## 8. Background language

- 42–64 px subtle square grids
- Radial glows positioned behind the focal visual
- Thin orbit lines and payment paths
- Soft circles used sparingly for depth
- Light sections may use a 4–6% blue grid
- Dark sections may use a 10–14% white grid

## 9. Image art direction

### Consistent AI ambassador

- Fictional Indian fintech professional
- 30–40 years old
- Navy suit, white shirt, restrained orange or blue accent
- Confident but approachable expression
- Clean, well-lit face and natural skin texture
- Identical face and wardrobe language across scenes

Planned ambassador images:

1. Transparent waist-up portrait for About/Impact
2. Retail partner interaction inside a modern service outlet
3. Partner network/Why Choose Us portrait

### Other generated visuals

1. Dark financial technology hero ecosystem
2. Assisted banking/retail outlet scene
3. Security infrastructure illustration
4. Product ecosystem or connected-services illustration
5. API/operations infrastructure illustration

Every image must have a defined desktop focal point and a mobile-safe crop.

## 10. Motion system

- Entrance reveal: 450–650 ms, translate 16–24 px with opacity
- Floating cards: 4–6 second subtle vertical loop
- Counters: one-time count-up on viewport entry
- Product carousel: manual controls plus optional 6–8 second autoplay
- Hover: 180–260 ms
- Respect `prefers-reduced-motion`

No continuous large background movement and no scroll hijacking.

## 11. Detailed desktop wireframe

1. **Fixed glass header** — logo, Products, Partners, Company, Resources, login and partner CTA
2. **Dark cinematic hero** — editorial headline left, AI technology visual right, floating proof cards and three approved metrics
3. **Product ecosystem deck** — 3–5 large product-family cards similar in depth to a brand portfolio
4. **Certification strip** — approved badges only
5. **About/impact** — copy and statistics left, consistent ambassador/partner montage right
6. **National presence** — map/network visual plus approved reach statistics
7. **Security** — dark split layout with four layered security controls
8. **Services suite** — horizontal/slider presentation for confirmed services
9. **Partner opportunity** — retailer and distributor paths with onboarding steps
10. **Technology platform** — operational capability diagram and dashboard-style supporting cards
11. **Why choose us** — ambassador visual plus four value cards
12. **Testimonials** — approved partner stories
13. **Media/updates** — approved press only; hidden when empty
14. **FAQ** — accordion with onboarding and service questions
15. **Conversion CTA** — call/email/partner onboarding
16. **Legal footer** — contact hub, company disclaimer, links, safety warning and approved badges

## 12. Mobile wireframe rules

- Fixed 64–68 px header with compact logo and menu button
- Hero copy first; focal image becomes a low-opacity background crop
- Metrics displayed as three compact columns
- Product ecosystem becomes horizontal snap cards
- Two-column editorial sections stack with copy before visual
- Ambassador crop remains waist-up and never cuts through the face
- Security cards stack one per row
- CTA buttons become full width
- Footer becomes two columns, with brand and legal information full width

## 13. Accessibility and quality gates

- Minimum text contrast: WCAG AA
- Visible keyboard focus
- Minimum interactive target: 44×44 px
- Semantic heading sequence
- Descriptive image alt text; decorative assets use empty alt
- No critical information only in colour
- No autoplay video with sound
- No horizontal page overflow at 320 px

## 14. Step 2 acceptance criteria

- Logo-derived colour system defined
- Typography hierarchy defined
- Spacing and grid defined
- Cards, buttons and icon styles defined
- AI-image and ambassador direction defined
- Desktop section wireframe defined
- Mobile layout rules defined
- Motion and accessibility rules defined

