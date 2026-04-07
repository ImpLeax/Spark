from rest_framework import serializers
from user.models import Profile
from .models import Interactions


class RecommendationSerializer(serializers.ModelSerializer):
    """User info serializer class"""

    distance_km = serializers.SerializerMethodField()
    shared_interests_score = serializers.IntegerField(source='relevance_score', read_only=True)

    username = serializers.CharField(source='user.username', read_only=True)

    age = serializers.IntegerField(source='additional_info.age', read_only=True)
    bio = serializers.CharField(source='additional_info.bio', read_only=True)
    intention = serializers.CharField(source='intention.name', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'user_id',
            'username',
            'first_name',
            'age',
            'bio',
            'avatar',
            'shared_interests_score',
            'distance_km',
            'intention'
        ]

    def get_distance_km(self, obj):
        distance = getattr(obj, 'distance_to_me', None)
        if distance is not None:
            try:
                return round(distance.km, 1)
            except AttributeError:
                return None
        return None


class InteractionSerializer(serializers.ModelSerializer):
    """Interaction info serializer class"""

    class Meta:
        model = Interactions
        fields = ['is_like', 'receiver']

    def validate(self, data):
        if self.context['request'].user == data['receiver']:
            raise serializers.ValidationError("You cannot interact with yourself.")
        return data