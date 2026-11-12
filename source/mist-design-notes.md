# Mist interaction

Implementation brief: persistent blue and faint violet smoke emitted near the two figures and their heads; pointer movement contributes local acceleration, never an immediate positional offset; damped momentum, upward drift, gradual lifetime fades and bounded velocity; pause and reduced-motion support

References inspected
- https://21st.dev/@jatin-yadav05/components/smoke-card (particle lifecycle approach; no React code copied)
- https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu (velocity, advection and forces)

The implementation is a lightweight inertial particle approximation, not a Navier-Stokes solver
