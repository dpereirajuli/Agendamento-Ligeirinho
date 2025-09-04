import { Suspense, lazy, ComponentType } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface LazyWrapperProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center py-20">
    <Card className="w-96">
      <CardContent className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </CardContent>
    </Card>
  </div>
);

export function LazyWrapper({ component, fallback = <DefaultFallback /> }: LazyWrapperProps) {
  const LazyComponent = lazy(component);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent />
    </Suspense>
  );
}
