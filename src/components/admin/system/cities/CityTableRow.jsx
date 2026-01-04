import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { deleteCity, changeCityStatus } from '../../../../services/adminCitiesService';
import { useCan } from '../../../../utils/permissions';

const CityTableRow = ({ city, isSelected, onSelect, onRefresh }) => {
    const canEditCity = useCan('pos.cities.edit_cities');
    const canDeleteCity = useCan('pos.cities.delete_cities');
    const [showActions, setShowActions] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef(null);

    useEffect(() => {
        if (showActions && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({ top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right + window.scrollX });
        }
    }, [showActions]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this city?')) return;
        const response = await deleteCity(city.id);
        response.success ? (toast.success('City deleted'), onRefresh()) : toast.error(response.error || 'Failed to delete');
    };

    const handleStatusChange = async () => {
        const response = await changeCityStatus(city.id);
        response.success ? (toast.success('Status changed'), onRefresh()) : toast.error(response.error || 'Failed to change status');
    };

    return (
        <tr>
            <td><div className="form-check form-check-sm form-check-custom form-check-solid">
                <input className="form-check-input" type="checkbox" checked={isSelected} onChange={() => onSelect(city.id)} />
            </div></td>
            <td><Link to={`/admin/system/cities/${city.id}`} className="text-gray-800 text-hover-primary fw-bold">{city.name_en}</Link></td>
            <td>{city.name_ar}</td>
            <td>{city.country_name || 'N/A'}</td>
            <td>
                <button onClick={handleStatusChange} className={`badge badge-light-${city.status ? 'success' : 'danger'} cursor-pointer border-0`}>
                    {city.status ? 'Active' : 'Inactive'}
                </button>
            </td>
            <td>{new Date(city.created_at).toLocaleDateString()}</td>
            <td className="text-end">
                <div className="dropdown">
                    <button ref={buttonRef} className="btn btn-sm btn-light btn-active-light-primary" type="button" onClick={() => setShowActions(!showActions)} onBlur={() => setTimeout(() => setShowActions(false), 200)}>
                        Actions <i className="ki-duotone ki-down fs-5 ms-1"></i>
                    </button>
                    {showActions && (
                        <div className="dropdown-menu dropdown-menu-end show" style={{ position: 'fixed', top: `${dropdownPosition.top}px`, right: `${dropdownPosition.right}px`, left: 'auto', zIndex: 1050 }}>
                            <Link to={`/admin/system/cities/${city.id}`} className="dropdown-item" onMouseDown={(e) => e.preventDefault()}>
                                <i className="ki-duotone ki-eye fs-5 me-2"><span className="path1"></span><span className="path2"></span><span className="path3"></span></i>
                                View
                            </Link>
                            {canEditCity && (
                                <Link to={`/admin/system/cities/${city.id}/edit`} className="dropdown-item" onMouseDown={(e) => e.preventDefault()}>
                                    <i className="ki-duotone ki-pencil fs-5 me-2"><span className="path1"></span><span className="path2"></span></i>
                                    Edit
                                </Link>
                            )}
                            <button onMouseDown={(e) => { e.preventDefault(); handleStatusChange(); }} className="dropdown-item">
                                <i className="ki-duotone ki-toggle-on fs-5 me-2"><span className="path1"></span><span className="path2"></span></i>
                                Toggle Status
                            </button>
                            {canDeleteCity && (
                                <>
                                    <div className="dropdown-divider"></div>
                                    <button onMouseDown={(e) => { e.preventDefault(); handleDelete(); }} className="dropdown-item text-danger">
                                        <i className="ki-duotone ki-trash fs-5 me-2"><span className="path1"></span><span className="path2"></span><span className="path3"></span><span className="path4"></span><span className="path5"></span></i>
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default CityTableRow;
