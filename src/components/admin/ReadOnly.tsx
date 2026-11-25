/**
 * For staff with the "Просмотр" role: everything inside stays visible, but its fields and buttons are
 * disabled (the actions refuse such staff anyway). Links keep working.
 */
export default function ReadOnly({ when, children }: { when: boolean; children: React.ReactNode }) {
  if (!when) return <>{children}</>;
  return (
    <fieldset disabled className="contents">
      {children}
    </fieldset>
  );
}
