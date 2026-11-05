import { Link, useRouteError } from 'react-router-dom';
import ErrorState from '@/components/common/ErrorState/ErrorState';
import Button from '@/components/common/Button/Button';

/** Router-level error screen (failed chunk load, render crash). */
export default function RouteError() {
  const error = useRouteError();
  if (error) console.error(error);
  return (
    <div className="container page">
      <ErrorState
        title="این صفحه باز نشد"
        message="شاید اینترنتت قطع شده یا مشکلی پیش آمده. صفحه را دوباره بارگذاری کن یا به خانه برگرد."
        onRetry={() => window.location.reload()}
      >
        <Button as={Link} to="/" variant="ghost">برگشت به خانه</Button>
      </ErrorState>
    </div>
  );
}
