import React from 'react';
import UploadLocationImageModal from '../../../../../components/UploadLocationImageModal.jsx';

const MediaUploadModal = ({ open, onClose, onCreated }) => open ? <UploadLocationImageModal isOpen onClose={onClose} onAssetCreated={onCreated} /> : null;

export default MediaUploadModal;

