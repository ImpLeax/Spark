from django.contrib import admin
from .models import (
    User, Profile, Info, Gender, Photo,
    Interest, ProfileInterest, Setting, RelationshipIntention
)


@admin.register(User)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email')
    list_filter = ('is_active', 'is_staff', 'date_joined')
    readonly_fields = ('date_joined', 'last_active')

    actions = ['activate_users', 'deactivate_users']

    @admin.action(description="Activate selected users")
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} users activated")

    @admin.action(description="Deactivate selected users")
    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} users deactivated")

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'first_name', 'last_name', 'additional_info__birth_date', 'location', 'gender')
    search_fields = ('user__username', 'first_name', 'last_name', 'location')
    list_filter = ('gender', 'looking_for')

admin.site.register(Info)
admin.site.register(Gender)
admin.site.register(Photo)
admin.site.register(Interest)
admin.site.register(ProfileInterest)
admin.site.register(Setting)
admin.site.register(RelationshipIntention)

