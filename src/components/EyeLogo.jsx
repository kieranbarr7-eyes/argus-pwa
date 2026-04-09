/**
 * Argus eye logo — SVG rendered inline for crisp scaling.
 */
export default function EyeLogo({ size = 48 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer eye shape */}
      <ellipse
        cx="24"
        cy="24"
        rx="16"
        ry="10"
        stroke="#3B82F6"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Iris */}
      <circle cx="24" cy="24" r="6" fill="#3B82F6" />
      {/* Pupil */}
      <circle cx="24" cy="24" r="2.5" fill="#0A1628" />
      {/* Highlight */}
      <circle cx="26" cy="22" r="1.2" fill="white" opacity="0.6" />
    </svg>
  );
}
