// template (bukan layout) dipasang ulang di setiap navigasi, jadi animasi masuk ikut berulang.
export default function DashboardTemplate({ children }) {
  return <div className="anim-masuk">{children}</div>;
}
