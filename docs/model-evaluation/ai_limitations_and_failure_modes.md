# VestiAI — AI Model Limitations, Edge Cases & Failure Modes (TASK-22)

## 1. Overview
Virtual Try-On models rely on 2D image-to-image conditional diffusion. While they produce remarkable visual approximations, they are probabilistic generative models that do not perform physical cloth simulation or 3D geometric volumetric reconstruction. To prevent unrealistic expectations and ensure technical transparency, this document catalogs the inherent limitations, edge cases, and known failure modes of VestiAI.

---

## 2. Key Limitations Taxonomy

```text
+-------------------------------------------------------------------------------+
|                       VTON GENERATIVE FAILURE MODES                          |
+---------------------+-------------------+------------------+------------------+
|      POSE & ARMS    |     OCCLUSION     |    LIGHTING &    |   GARMENT TYPE   |
|   Crossing / Angle  |   Hair / Hands    |    RESOLUTION    |   & COMPLEXITY   |
+---------------------+-------------------+------------------+------------------+
```

### 2.1 Body Pose & Arm Positions
- **Frontal Bias:** Both IDM-VTON and CatVTON are trained predominantly on standard e-commerce studio photography with front-facing upright subjects.
- **Crossed Arms:** If the user has arms crossed over their chest, the diffusion inpainting mask incorrectly classifies the arms as part of the torso replacement area. This leads to garment patterns bleeding over the forearms or limbs becoming distorted ("melted arms").
- **Extreme Profile / Side Poses:** If the user turns beyond 45° from the camera, the model struggles to estimate how the front flat-lay garment wraps around the 3D torso, causing asymmetrical stretched textures.
- **Hands in Pockets or on Hips:** Moderate bending of elbows is handled reasonably well, but hands resting directly over the shirt fabric may produce blurred or missing fingers.

### 2.2 Occlusion & Secondary Objects
- **Long Hair Covering Chest:** Hair draping over the shoulders onto the chest can either be inadvertently erased by the try-on mask or cause the garment neckline to fragment.
- **Accessories & Bags:** Crossbody bag straps, thick scarves, necklaces, or jackets draped over the shoulder confuse the parsing network. The strap may disappear or become embedded inside the generated shirt.

### 2.3 Lighting, Contrast & Color Drift
- **Shadow Direction Inconsistency:** If the person was photographed in warm ambient indoor lighting with side shadows, but the garment was shot in neutral white studio lighting, the generated image may display subtle lighting mismatch between the neck/face and the synthesized torso.
- **Under-Exposed / Blurry Photos:** Poor lighting and camera noise degrade the feature representation in CLIP and VAE, resulting in washed-out colors or mottled noise artifacts.

### 2.4 Garment Texture & Structural Details
- **Micro-Typography & Barcodes:** While large brand logos and graphic prints transfer with high fidelity, microscopic text (<10 pixels) may turn into unreadable pseudo-lettering.
- **Sheer, Lace & Translucent Fabrics:** The model assumes opaque textiles. Semi-transparent fabrics or open-mesh weaves are rendered as solid surfaces.
- **Collar & Button Realism:** On formal dress shirts, button alignment may occasionally vary slightly between the left and right placket.

### 2.5 Scope Disclaimer (Fit vs. Visual Look)
- VestiAI produces a **2D visual impression** of the garment style, color, and pattern.
- It **does not measure** chest circumference, sleeve length, shoulder width, or tailor fit.
- It cannot determine whether a size Medium or Large is appropriate for the wearer.

---

## 3. Mitigation Strategies Implemented in VestiAI

| Failure Mode | Mitigation in VestiAI |
|---|---|
| Non-frontal or occluded poses | Upload preflight guidance cards displaying acceptable vs. unacceptable poses before submission. |
| Inpainting blur & noise | Minimum input resolution validation (rejecting images < 512px) with auto-centering. |
| User expectation mismatch | Prominent UI disclaimer: *"VestiAI provides an AI visual preview for aesthetic evaluation. It does not certify physical fit, sizing, or tailoring."* |
| Severe model distortion / OOM | Error recovery handlers with friendly retry suggestions and error codes. |

