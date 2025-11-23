import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const SGDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Surveillant Général</h1>
        <p className="text-gray-600 mt-1">Gestion des stagiaires et formateurs</p>
      </div>

      <Card>
        <div className="text-center py-12">
          <p className="text-gray-500">Dashboard Surveillant Général - En cours de développement</p>
          <Badge variant="warning" className="mt-4">Coming Soon</Badge>
        </div>
      </Card>
    </div>
  );
};

export default SGDashboard;
