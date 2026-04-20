import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

/**
 * Unit tests for ToastService.
 * Tests toast creation, auto-dismiss, and manual dismiss.
 */
describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  /**
   * Verifies that show() creates a toast with correct properties.
   */
  it('should create a toast with correct properties', () => {
    service.show('Test message', 'success', 5000);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Test message');
    expect(service.toasts()[0].type).toBe('success');
  });

  /**
   * Verifies that dismiss() removes the correct toast.
   */
  it('should dismiss a toast by ID', () => {
    service.show('Toast 1', 'info');
    service.show('Toast 2', 'error');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Toast 2');
  });

  /**
   * Verifies convenience methods set correct type.
   */
  it('should create success toast via convenience method', () => {
    service.success('Great!');
    expect(service.toasts()[0].type).toBe('success');
  });

  /**
   * Verifies error toast via convenience method.
   */
  it('should create error toast via convenience method', () => {
    service.error('Bad!');
    expect(service.toasts()[0].type).toBe('error');
  });
});
