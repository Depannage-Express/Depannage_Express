from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.core.permissions import IsAdmin
from .models import Incident
from .serializers import IncidentSerializer, IncidentCreateSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def list_incidents(request):
    qs = Incident.objects.all()

    status = request.query_params.get('status')
    if status:
        qs = qs.filter(status=status)

    gravity = request.query_params.get('gravity')
    if gravity:
        qs = qs.filter(gravity=gravity)

    search = request.query_params.get('search', '').strip()
    if search:
        qs = qs.filter(
            Q(emitter_name__icontains=search) | Q(target_name__icontains=search)
        )

    return Response(IncidentSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def incident_stats(request):
    total      = Incident.objects.count()
    pending    = Incident.objects.filter(status='pending').count()
    resolved   = Incident.objects.filter(status='resolved').count()
    rejected   = Incident.objects.filter(status='rejected').count()
    high_gravity = Incident.objects.filter(gravity='high').count()

    return Response({
        'total':        total,
        'pending':      pending,
        'resolved':     resolved,
        'rejected':     rejected,
        'high_gravity': high_gravity,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def incident_detail(request, pk):
    try:
        incident = Incident.objects.get(pk=pk)
    except Incident.DoesNotExist:
        return Response({'error': 'Incident introuvable.'}, status=404)
    return Response(IncidentSerializer(incident).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def resolve_incident(request, pk):
    try:
        incident = Incident.objects.get(pk=pk)
    except Incident.DoesNotExist:
        return Response({'error': 'Incident introuvable.'}, status=404)

    if incident.status != 'pending':
        return Response({'error': 'Seul un incident en attente peut être résolu.'}, status=400)

    incident.status = 'resolved'
    admin_note = request.data.get('admin_note', '').strip()
    if admin_note:
        incident.admin_note = admin_note
    incident.save()
    return Response(IncidentSerializer(incident).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def reject_incident(request, pk):
    try:
        incident = Incident.objects.get(pk=pk)
    except Incident.DoesNotExist:
        return Response({'error': 'Incident introuvable.'}, status=404)

    if incident.status != 'pending':
        return Response({'error': 'Seul un incident en attente peut être rejeté.'}, status=400)

    incident.status = 'rejected'
    admin_note = request.data.get('admin_note', '').strip()
    if admin_note:
        incident.admin_note = admin_note
    incident.save()
    return Response(IncidentSerializer(incident).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def suspend_incident(request, pk):
    try:
        incident = Incident.objects.get(pk=pk)
    except Incident.DoesNotExist:
        return Response({'error': 'Incident introuvable.'}, status=404)

    if incident.status != 'pending':
        return Response({'error': 'Seul un incident en attente peut entraîner une suspension.'}, status=400)

    incident.status = 'suspended'
    admin_note = request.data.get('admin_note', '').strip()
    if admin_note:
        incident.admin_note = admin_note
    incident.save()
    return Response(IncidentSerializer(incident).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_incident(request):
    serializer = IncidentCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    emitter_type = request.data.get('emitter_type')
    if emitter_type == 'driver':
        driver_token = request.data.get('driver_token')
        breakdown_id = request.data.get('breakdown_id')
        if not driver_token or not breakdown_id:
            return Response(
                {'error': 'driver_token et breakdown_id requis pour un signalement conducteur.'},
                status=400,
            )
        from apps.breakdowns.models import BreakdownRequest
        try:
            BreakdownRequest.objects.get(pk=breakdown_id, driver_token=driver_token)
        except BreakdownRequest.DoesNotExist:
            return Response({'error': 'Token conducteur invalide.'}, status=403)
    elif emitter_type == 'mechanic':
        if not request.user.is_authenticated:
            return Response({'error': 'Authentification requise pour un signalement mécanicien.'}, status=401)

    incident = serializer.save()
    return Response(IncidentSerializer(incident).data, status=201)
