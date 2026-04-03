from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Interactions, Match

"""Signal receiver for check is match"""
@receiver(post_save, sender=Interactions)
def check_for_match(sender, instance, created, **kwargs):
    if created and instance.is_like:
        reversed_like = Interactions.objects.filter(
            sender = instance.receiver,
            receiver = instance.sender,
            is_like = True
        ).exists()

        if reversed_like:
            users = sorted([instance.sender.id, instance.receiver.id])
            Match.objects.get_or_create(
                user_1_id = users[0],
                user_2_id = users[1],
            )