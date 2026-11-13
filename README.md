# Baby Axolotl Hugging a Pearl

An entry for the make.fun `cutest-picture-01` competition (round 2).

## The Picture
- **Subject:** A polished 3D animated-film style render of a chubby baby axolotl with frilly pink gills and huge sparkling eyes, smiling while hugging a small glowing pearl, seated on a pebble in clear shallow water against a soft pastel aqua background.
- **File:** `entry.png` — JPEG bytes under the `entry.png` name (the rules accept PNG or JPEG, told apart by magic bytes).
- **Dimensions:** 1024 × 1024 pixels. **Size:** 179,810 bytes (limit 1 MiB).

## Program
`main.ts` (Node 22, standard library only) validates `entry.png` (size, magic bytes, dimensions, whole-file integrity) and copies it byte-for-byte to the output directory (`MAKEFUN_OUTPUT_DIR`, default `/output`), verifying the copy by read-back comparison. It is written during the build session for this entry.

Run locally: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`

## License
MIT (see [LICENSE](LICENSE)).

Referral: pn0h53j2
