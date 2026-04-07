from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Interactions, Match
from user.models import ProfileInterest, InterestAffinity

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

"""Triggered with every swipe. Changes the sender's personal 'weight' of interests
based on the candidate's interests (+2 for like, -1 for dislike)."""
@receiver(post_save, sender=Interactions)
def update_interest_affinity(sender, instance, created, **kwargs):
    if created:
        receiver_profile = instance.receiver.profile
        receiver_profile_id = ProfileInterest.objects.filter(
            profile = receiver_profile
        ).values_list('interest_id', flat=True)

        score_delta = 2 if instance.is_like else -1

        for interest_id in receiver_profile_id:
            affinity, _ = InterestAffinity.objects.get_or_create(
                user = instance.sender,
                interest_id = interest_id,
                defaults={'score': 50}
            )

            affinity.score += score_delta

            if affinity.score > 100:
                affinity.score = 100
            elif affinity.score < 0:
                affinity.score = 0

            affinity.save()

"""Triggered when a user adds a new interest to their profile."""
@receiver(post_save, sender=ProfileInterest)
def set_initial_affinity_for_own_interest(sender, instance, created, **kwargs):
    if created:
        InterestAffinity.objects.update_or_create(
            user=instance.profile.user,
            interest=instance.interest,
            defaults={'score': 75}
        )