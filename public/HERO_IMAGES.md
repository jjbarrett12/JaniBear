# Hero images (required)

The hero uses a **backdrop image** and a **foreground devices image**.

## Backdrop (background)

The hero tries these in order; the first one found is used:

1. **stadium-hero3.png** – Stadium / arena backdrop (e.g. basketball court, cleaning crew). **Preferred.**
2. **scrubber.png** (or scrubber.jpg) – Ride-on scrubber / large venue photo.
3. **scrubber .png** – Alternate scrubber filename.

Put your chosen backdrop file in this `public` folder. For the stadium hero, name it `stadium-hero3.png`.

## Foreground (devices)

- **hero-devices-transparent.png** – Laptop + phone with JANIBEAR UI **with transparent background** (recommended). Fallbacks: `hero-devices.png` or `Laptop and phone display .png`.

Put the devices image in `public` as well. Use a transparent PNG so the backdrop shows through.

If the backdrop is missing, the hero falls back to the next path in the list, or a dark area if all fail.
