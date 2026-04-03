from django.apps import AppConfig


class RecommendationsConfig(AppConfig):
    name = 'recommendations'

    def ready(self):
        import recommendations.signals
