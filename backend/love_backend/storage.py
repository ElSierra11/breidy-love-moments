import os
from cloudinary_storage.storage import MediaCloudinaryStorage, RESOURCE_TYPES

class DynamicCloudinaryStorage(MediaCloudinaryStorage):
    def _get_resource_type(self, name):
        extension = os.path.splitext(name)[1].lower()
        if extension in ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.ogv', '.3gp', '.m4v']:
            return RESOURCE_TYPES['VIDEO']
        elif extension in ['.pdf', '.zip', '.rar', '.txt', '.doc', '.docx', '.xls', '.xlsx']:
            return RESOURCE_TYPES['RAW']
        return RESOURCE_TYPES['IMAGE']
