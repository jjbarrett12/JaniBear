# Hero images (required)

The hero uses a **backdrop image** and a **foreground devices image**.

## Backdrop (background)

**stadium-hero3.png** – Basketball court in a dimly lit arena, empty blue seats, cleaning crew in the distance. Optional: same image can include laptop + phone on the court (composite). Save your chosen hero background as `stadium-hero3.png` in this `public` folder. If the file is missing, the hero shows a dark background.

## Foreground (devices)

- **hero-devices-transparent.png** – Laptop + phone with JANIBEAR UI **with transparent background** (recommended). Fallbacks: `hero-devices.png` or `Laptop and phone display .png`.

Put the devices image in `public` as well. Use a transparent PNG so the backdrop shows through.

If the backdrop is missing, the hero falls back to the next path in the list, or a dark area if all fail.
